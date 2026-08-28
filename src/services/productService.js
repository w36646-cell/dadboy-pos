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

    id: normalizeId(row.id),

    name: row.name || "",

    category: row.category || "",

    price: Number(

      row.price || 0

    ),

    cost: Number(

      row.cost || 0

    ),

    image: row.image || "",

    stock: Number(

      row.stock ?? 0

    ),

    // ลำดับสินค้า

    sortOrder: Number(

      row.sort_order ?? 0

    ),

    minStock: Number(

      row.min_stock ?? 5

    ),

    trackStock:

      row.track_stock === true,

    hasOption:

      row.has_option === true,

    options:

      Array.isArray(row.options)

        ? row.options

        : [],

    packEnabled:

      row.pack_enabled === true,

    packQty: Math.max(

      1,

      Number(

        row.pack_qty ?? 1

      ) || 1

    ),

    packPrice: Math.max(

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

    id: String(product.id),

    name:

      product.name || "",

    category:

      product.category || "",

    price: Number(

      product.price || 0

    ),

    cost: Number(

      product.cost || 0

    ),

    image:

      product.image || "",

    stock: Number(

      stock ??

        product.stock ??

        0

    ),

    // ลำดับสินค้า

    sort_order: Number(

      product.sortOrder ?? 0

    ),

    min_stock: Number(

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

    pack_enabled:

      product.packEnabled ===

      true,

    pack_qty: Math.max(

      1,

      Number(

        product.packQty ?? 1

      ) || 1

    ),

    pack_price: Math.max(

      0,

      Number(

        product.packPrice ?? 0

      ) || 0

    ),

  };

}

/*

  =====================================

  โหลดสินค้าจาก Supabase

  เรียงตาม sort_order ก่อน

  แล้วใช้ id เป็นลำดับสำรอง

  =====================================

*/

export async function getCloudProducts() {

  const {

    data,

    error,

  } =

    await supabase

      .from("products")

      .select("*")

      .order(

        "sort_order",

        {

          ascending: true,

        }

      )

      .order(

        "id",

        {

          ascending: true,

        }

      );

  if (error) {

    throw error;

  }

  return (

    data || []

  ).map(

    fromDatabase

  );

}

/*

  =====================================

  โหลดสินค้าแบบเบาสำหรับ Dashboard

  ไม่โหลด:

  - image

  - options

  - price

  - category

  - pack settings

  Dashboard ใช้เฉพาะ:

  - id

  - name

  - cost

  - stock

  - min_stock

  - track_stock

  =====================================

*/

export async function getCloudDashboardProducts() {

  const {

    data,

    error,

  } =

    await supabase

      .from("products")

      .select(`

        id,

        name,

        cost,

        stock,

        min_stock,

        track_stock

      `);

  if (error) {

    throw error;

  }

  return (

    data || []

  ).map(

    (row) => ({

      id:

        normalizeId(
row.id

        ),

      name:

        row.name || "",

      cost:

        Number(

          row.cost || 0

        ),

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

      isActive: row.is_active !== false,

    })

  );

}

/*

  =====================================

  บันทึกสินค้า 1 รายการ

  =====================================

*/

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

          onConflict: "id",

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

/*

  =====================================

  Upload สินค้าหลายรายการ

  =====================================

*/

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

          onConflict: "id",

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

/*

  =====================================

  บันทึกลำดับสินค้า

  ใช้สำหรับลากเรียงใน Product Manager

  =====================================

*/

export async function updateProductSortOrders(

  products

) {

  if (

    !Array.isArray(

      products

    ) ||

    products.length === 0

  ) {

    return [];

  }

  const jobs =

    products.map(

      (

        product,

        index

      ) =>

        supabase

          .from(

            "products"

          )

          .update({

            sort_order:

              index + 1,

          })

          .eq(

            "id",

            String(
product.id

            )

          )

    );

  const results =

    await Promise.all(

      jobs

    );

  const failed =

    results.find(

      (result) =>

        result.error

    );

  if (failed?.error) {

    throw failed.error;

  }

  return products.map(

    (

      product,

      index

    ) => ({

      ...product,

      sortOrder:

        index + 1,

    })

  );

}

/*

  =====================================

  Update Stock สินค้า 1 รายการ

  =====================================

*/

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

  "id, stock"

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

  return {

  id:

    normalizeId(
data.id

    ),

  stock:

    actualStock,

};

}

/*

  =====================================

  Atomic Stock Delta

  ใช้สำหรับ:

  + รับสินค้าเข้า

  - ขายสินค้า

  - กินเอง

  + คืนสินค้า

  operationId เดิมยิงซ้ำได้

  Database จะทำเพียงครั้งเดียว

  =====================================

*/

export async function applyCloudStockDeltaOnce(

  operationId,

  productId,

  delta

) {

  const safeOperationId =

    String(

      operationId || ""

    ).trim();

  const id =

    String(

      productId ?? ""

    ).trim();

  const safeDelta =

    Number(delta);


  if (!safeOperationId) {

    throw new Error(

      "Stock operationId is required"

    );

  }


  if (!id) {

    throw new Error(

      "Stock productId is required"

    );

  }


  if (

    !Number.isSafeInteger(

      safeDelta

    ) ||

    safeDelta === 0

  ) {

    throw new Error(

      `Invalid stock delta: ${delta}`

    );

  }


  const {

    data,

    error,

  } =

    await supabase

      .rpc(

        "apply_stock_delta_once",

        {

          p_operation_id:

            safeOperationId,

          p_product_id:

            id,

          p_delta:

            safeDelta,

        }

      )

      .maybeSingle();


  if (error) {

    throw error;

  }


  if (!data) {

    throw new Error(

      `Atomic stock delta returned no data: ${id}`

    );

  }


  return {

    id:

      normalizeId(

        data.product_id

      ),

    previousStock:

      Number(

        data.previous_stock ?? 0

      ),

    stock:

      Number(

        data.new_stock ?? 0

      ),

    alreadyApplied:

      data.already_applied ===

      true,

  };

}


/*

  =====================================

  Atomic Set Stock

  ใช้เฉพาะการตั้งยอดจริง เช่น

  หน้า "ปรับสต๊อก"

  ไม่ใช้สำหรับขายหรือรับสินค้า

  =====================================

*/

export async function setCloudStockAbsoluteOnce(

  operationId,

  productId,

  newStock

) {

  const safeOperationId =

    String(

      operationId || ""

    ).trim();

  const id =

    String(

      productId ?? ""

    ).trim();

  const safeStock =

    Number(newStock);


  if (!safeOperationId) {

    throw new Error(

      "Stock operationId is required"

    );

  }


  if (!id) {

    throw new Error(

      "Stock productId is required"

    );

  }


  if (

    !Number.isSafeInteger(

      safeStock

    ) ||

    safeStock < 0

  ) {

    throw new Error(

      `Invalid absolute stock: ${newStock}`

    );

  }


  const {

    data,

    error,

  } =

    await supabase

      .rpc(

        "set_stock_absolute_once",

        {

          p_operation_id:

            safeOperationId,

          p_product_id:

            id,

          p_new_stock:

            safeStock,

        }

      )

      .maybeSingle();


  if (error) {

    throw error;

  }


  if (!data) {

    throw new Error(

      `Atomic stock set returned no data: ${id}`

    );

  }


  return {

    id:

      normalizeId(

        data.product_id

      ),

    previousStock:

      Number(

        data.previous_stock ?? 0

      ),

    stock:

      Number(

        data.new_stock ?? 0

      ),

    alreadyApplied:

      data.already_applied ===

      true,

  };

}
 
/*

  =====================================

  Update Stock หลังขาย

  =====================================

*/

export async function updateSoldCloudStocks(

  soldByProduct,

  inventory

) {

  const productIds =

    Object.keys(

      soldByProduct || {}

    );

  if (

    productIds.length ===

    0

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

/*

  =====================================

  คืน Stock จากรายการในบิล

  =====================================

*/

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

    รวมจำนวน Stock ที่ต้องคืน

    สินค้าปกติ:

    quantity = 2

    => คืน 2 ชิ้น

    สินค้าแพ็ก:

    quantity = 2 แพ็ก

    stockQuantity = 12 ชิ้น

    => คืน 12 ชิ้น

    ใช้ stockQuantity ก่อน

    แล้ว fallback ไป quantity

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

    productIds.length ===

    0

  ) {

    throw new Error(

      "ไม่พบจำนวนสินค้าที่สามารถคืน Stock ได้"

    );

  }

  const restoredInventory =

    {};

  /*

    ทำทีละ Product

    1. อ่าน Stock ล่าสุด

    2. บวกจำนวนที่คืน

    3. Update Cloud

    4. ตรวจสอบผล

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

        .from(

          "products"

        )

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

        .from(

          "products"

        )

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

    if (

      updateError

    ) {

      throw updateError;

    }

    if (

      !updatedRow

    ) {

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
