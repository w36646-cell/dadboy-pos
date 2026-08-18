import { supabase } from "../lib/supabase";

function normalizeId(id) {

  const value = String(id);

  if (/^\d+$/.test(value)) {

    return Number(value);

  }

  return value;

}

function fromDatabase(row) {

  return {

    id:

      normalizeId(row.id),

    name:

      row.name || "",

    category:

      row.category || "",

    price:

      Number(

        row.price || 0

      ),

    cost:

      Number(

        row.cost || 0

      ),

    image:

      row.image || "",

    stock:

      Number(

        row.stock ?? 0

      ),

    minStock:

      Number(

        row.min_stock ?? 5

      ),

    trackStock:

      row.track_stock === true,

    hasOption:

      row.has_option === true,

    options:

      Array.isArray(

        row.options

      )

        ? row.options

        : [],

    /*

      ==========================

      ขายยกแพ็ก

      ==========================

    */

    packEnabled:

      row.pack_enabled === true,

    packQty:

      Math.max(

        1,

        Number(

          row.pack_qty ?? 1

        ) || 1

      ),

    packPrice:

      Math.max(

        0,

        Number(

          row.pack_price ?? 0

        ) || 0

      ),

  };

}

function toDatabase(

  product,

  stock

) {

  return {

    id:

      String(
product.id

      ),

    name:

      product.name || "",

    category:

      product.category || "",

    price:

      Number(

        product.price || 0

      ),

    cost:

      Number(

        product.cost || 0

      ),

    image:

      product.image || "",

    stock:

      Number(

        stock ??

          product.stock ??

          0

      ),

    min_stock:

      Number(

        product.minStock ?? 5

      ),

    track_stock:

      product.trackStock ===

      true,

    has_option:

      product.hasOption ===

        true ||

      product.hasOptions ===

        true,

    options:

      Array.isArray(

        product.options

      )

        ? product.options

        : [],

    /*

      ==========================

      ขายยกแพ็ก

      ==========================

    */

    pack_enabled:

      product.packEnabled ===

      true,

    pack_qty:

      Math.max(

        1,

        Number(

          product.packQty ?? 1

        ) || 1

      ),

    pack_price:

      Math.max(

        0,

        Number(

          product.packPrice ?? 0

        ) || 0

      ),

  };

}

export async function getCloudProducts() {

  const {

    data,

    error,

  } =

    await supabase

      .from("products")

      .select("*")

      .order("id");

  if (error) {

    throw error;

  }

  return (

    data || []

  ).map(

    fromDatabase

  );

}

export async function saveCloudProduct(

  product,

  stock

) {

  const payload =

    toDatabase(

      product,

      stock

    );

  const {

    data,

    error,

  } =

    await supabase

      .from("products")

      .upsert(

        payload,

        {

          onConflict:

            "id",

        }

      )

      .select()

      .single();

  if (error) {

    throw error;

  }

  return fromDatabase(

    data

  );

}

export async function uploadProductsToCloud(

  products,

  inventory = {}

) {

  if (

    !Array.isArray(

      products

    ) ||

    products.length === 0

  ) {

    return [];

  }

  const payload =

    products.map(

      (product) =>

        toDatabase(

          product,

          inventory[
product.id

          ] ??

            product.stock ??

            0

        )

    );

  const {

    data,

    error,

  } =

    await supabase

      .from("products")

      .upsert(

        payload,

        {

          onConflict:

            "id",

        }

      )

      .select();

  if (error) {

    throw error;

  }

  return (

    data || []

  ).map(

    fromDatabase

  );

}

export async function updateCloudStock(

  productId,

  stock

) {

  const safeStock =

    Number(stock);

  if (

    !Number.isFinite(

      safeStock

    )

  ) {

    throw new Error(

      `Invalid stock value: ${stock}`

    );

  }

  const id =

    String(productId);

  const {

    data,

    error,

  } =

    await supabase

      .from("products")

      .update({

        stock:

          safeStock,

      })

      .eq(

        "id",

        id

      )

      .select(

        `

        id,

        name,

        category,

        price,

        cost,

        image,

        stock,

        min_stock,

        track_stock,

        has_option,

        options,

        pack_enabled,

        pack_qty,

        pack_price

        `

      )

      .maybeSingle();

  if (error) {

    throw error;

  }

  if (!data) {

    throw new Error(

      `ไม่พบสินค้าที่ต้องการอัปเดต Stock: ${id}`

    );

  }

  const actualStock =

    Number(

      data.stock ?? 0

    );

  if (

    actualStock !==

    safeStock

  ) {

    throw new Error(

      `Stock update verification failed: ${id}, expected ${safeStock}, got ${actualStock}`

    );

  }

  return fromDatabase(

    data

  );

}

export async function updateManyCloudStocks(

  inventory

) {

  const entries =

    Object.entries(

      inventory || {}

    );

  if (

    entries.length === 0

  ) {

    return [];

  }

  const results = [];

  for (

    const [

      productId,

      stock,

    ] of entries

  ) {

    const updated =

      await updateCloudStock(

        productId,

        stock

      );

    results.push(

      updated

    );

  }

  return results;

}

export async function updateSoldCloudStocks(

  soldByProduct,

  inventory

) {

  const productIds =

    Object.keys(

      soldByProduct || {}

    );

  if (

    productIds.length === 0

  ) {

    return [];

  }

  const jobs =

    productIds.map(

      (productId) => {

        const stock =

          Number(

            inventory[

              productId

            ] ?? 0

          );

        return updateCloudStock(

          productId,

          stock

        );

      }

    );

  return Promise.all(

    jobs

  );

}

export async function restoreCloudStocksFromItems(

  items

) {

  if (

    !Array.isArray(

      items

    ) ||

    items.length === 0

  ) {

    throw new Error(

      "ไม่มีรายการสินค้าในบิลสำหรับคืน Stock"

    );

  }

  /*

    ==========================

    รวมจำนวน Stock ที่ต้องคืน

    ==========================

    สินค้าปกติ:

    quantity = 2

    stockQuantity ไม่มี

    => คืน 2 ชิ้น

    สินค้าแพ็ก:

    quantity = 2 แพ็ก

    stockQuantity = 12 ชิ้น

    => คืน 12 ชิ้น

    จึงใช้ stockQuantity ก่อน

    แล้ว fallback ไป quantity

    เพื่อรองรับบิลเก่าด้วย

  */

  const quantities = {};

  items.forEach(

    (item) => {

      if (

        item?.productId ===

          undefined ||

        item?.productId ===

          null

      ) {

        return;

      }

      const productId =

        String(

          item.productId

        );

      const quantity =

        Number(

          item.stockQuantity ??

            item.quantity ??

            0

        );

      if (

        !Number.isFinite(

          quantity

        ) ||

        quantity <= 0

      ) {

        return;

      }

      quantities[

        productId

      ] =

        Number(

          quantities[

            productId

          ] || 0

        ) +

        quantity;

    }

  );

  const productIds =

    Object.keys(

      quantities

    );

  if (

    productIds.length === 0

  ) {

    throw new Error(

      "ไม่พบจำนวนสินค้าที่สามารถคืน Stock ได้"

    );

  }

  const restoredInventory =

    {};

  /*

    ทำทีละ Product

    1. อ่าน Stock ล่าสุดจาก Cloud

    2. บวกจำนวนคืน

    3. Update

    4. อ่านค่าที่ Supabase คืนมา

    5. ตรวจสอบว่า Stock เปลี่ยนจริง

  */

  for (

    const productId of

    productIds

  ) {

    const returnQty =

      Number(

        quantities[

          productId

        ]

      );

    console.log(

      "Restore stock start:",

      {

        productId,

        returnQty,

      }

    );

    const {

      data:

        currentRow,

      error:

        readError,

    } =

      await supabase

        .from("products")

        .select(

          "id, stock"

        )

        .eq(

          "id",

          productId

        )

        .maybeSingle();

    if (readError) {

      throw readError;

    }

    if (!currentRow) {

      throw new Error(

        `ไม่พบสินค้าใน Cloud: ${productId}`

      );

    }

    const currentStock =

      Number(

        currentRow.stock ??

          0

      );

    if (

      !Number.isFinite(

        currentStock

      )

    ) {

      throw new Error(

        `Stock ปัจจุบันไม่ถูกต้อง: ${productId}`

      );

    }

    const newStock =

      currentStock +

      returnQty;

    console.log(

      "Restore stock calculation:",

      {

        productId,

        currentStock,

        returnQty,

        newStock,

      }

    );

    const {

      data:

        updatedRow,

      error:

        updateError,

    } =

      await supabase

        .from("products")

        .update({

          stock:

            newStock,

        })

        .eq(

          "id",

          productId

        )

        .select(

          "id, stock"

        )

        .maybeSingle();

    if (updateError) {

      throw updateError;

    }

    if (!updatedRow) {

      throw new Error(

        `คืน Stock ไม่สำเร็จ ไม่พบสินค้า: ${productId}`

      );

    }

    const verifiedStock =

      Number(

        updatedRow.stock ??

          0

      );

    if (

      verifiedStock !==

      newStock

    ) {

      throw new Error(

        `คืน Stock ไม่สำเร็จ: ${productId}, ต้องเป็น ${newStock} แต่ Cloud เป็น ${verifiedStock}`

      );

    }

    restoredInventory[

      productId

    ] =

      verifiedStock;

    console.log(

      "Restore stock success:",

      {

        productId,

        oldStock:

          currentStock,

        returned:

          returnQty,

        newStock:

          verifiedStock,

      }

    );

  }

  return restoredInventory;

}

export async function deleteCloudProduct(

  productId

) {

  const {

    error,

  } =

    await supabase

      .from("products")

      .delete()

      .eq(

        "id",

        String(

          productId

        )

      );

  if (error) {

    throw error;

  }

  return true;

}
