import { supabase } from "../lib/supabase";

function fromSaleItemRow(row) {

  return {

    id: row.id,

    productId: row.product_id,

    productName:

      row.product_name || "",

    option:

      row.option_name || "",

    quantity:

      Number(row.qty || 0),

    unitPrice:

      Number(

        row.unit_price || 0

      ),

    unitCost:

      Number(

        row.unit_cost || 0

      ),

    lineTotal:

      Number(

        row.subtotal || 0

      ),

    lineCost:

      Number(

        row.cost_total || 0

      ),

    lineProfit:

      Number(

        row.profit || 0

      ),

  };

}

function fromSaleRow(row) {

  return {

    id:
row.id,

    billId:

      row.bill_id || "",

    soldAt:

      row.sold_at || "",

    soldDate:

      row.sold_date || "",

    soldTime:

      row.sold_time || "",

    totalQty:

      Number(

        row.total_qty || 0

      ),

    totalAmount:

      Number(

        row.total_amount || 0

      ),

    totalCost:

      Number(

        row.total_cost || 0

      ),

    totalProfit:

      Number(

        row.total_profit || 0

      ),

    items:

      Array.isArray(

        row.sale_items

      )

        ? row.sale_items.map(

            fromSaleItemRow

          )

        : [],

  };

}

function createSalePayload(

  sale

) {

  return {

    bill_id:

      sale.billId,

    sold_at:

      sale.soldAt,

    sold_date:

      sale.soldDate,

    sold_time:

      sale.soldTime,

    total_qty:

      Number(

        sale.totalQty || 0

      ),

    total_amount:

      Number(

        sale.totalAmount || 0

      ),

    total_cost:

      Number(

        sale.totalCost || 0

      ),

    total_profit:

      Number(

        sale.totalProfit || 0

      ),

  };

}

function createItemPayload(

  saleId,

  items

) {

  return (

    items || []

  ).map(

    (item) => ({

      sale_id:

        saleId,

      product_id:

        String(

          item.productId

        ),

      product_name:

        item.productName ||

        "",

      option_name:

        item.option || "",

      qty:

        Number(

          item.quantity || 0

        ),

      unit_price:

        Number(

          item.unitPrice ||

            0

        ),

      unit_cost:

        Number(

          item.unitCost ||

            0

        ),

      subtotal:

        Number(

          item.lineTotal ||

            0

        ),

      cost_total:

        Number(

          item.lineCost ||

            0

        ),

      profit:

        Number(

          item.lineProfit ||

            0

        ),

    })

  );

}

export async function saveCloudSale(

  sale

) {

  if (

    !sale?.billId

  ) {

    throw new Error(

      "Sale billId is required"

    );

  }

  /*

    ==========================

    1. หัวบิล

    bill_id เป็น UNIQUE แล้ว

    ดังนั้นส่งบิลเดิมซ้ำ

    จะอัปเดตแถวเดิม

    ==========================

  */

  const salePayload =

    createSalePayload(

      sale

    );

  const {

    data: saleRow,

    error: saleError,

  } =

    await supabase

      .from("sales")

      .upsert(

        salePayload,

        {

          onConflict:

            "bill_id",

        }

      )

      .select()

      .single();

  if (saleError) {

    throw saleError;

  }

  /*

    ==========================

    2. รายการสินค้า

    ไม่ใช้ delete + insert แล้ว

    ใช้ UNIQUE:

    sale_id,

    product_id,

    option_name

    ถ้า Sync ซ้ำ

    จะ UPDATE แถวเดิม

    ไม่สร้างแถวใหม่

    ==========================

  */

  const itemPayload =

    createItemPayload(
saleRow.id,

      sale.items

    );

  if (

    itemPayload.length >

    0

  ) {

    const {

      error:

        itemError,

    } =

      await supabase

        .from(

          "sale_items"

        )

        .upsert(

          itemPayload,

          {

            onConflict:

              "sale_id,product_id,option_name",

          }

        );

    if (itemError) {

      throw itemError;

    }

  }

  return {

    ...sale,

    id:
saleRow.id,

    cloudId:
saleRow.id,

  };

}

export async function getCloudSales() {

  const {

    data,

    error,

  } =

    await supabase

      .from("sales")

      .select(`

        *,

        sale_items (

          id,

          product_id,

          product_name,

          option_name,

          qty,

          unit_price,

          unit_cost,

          subtotal,

          cost_total,

          profit

        )

      `)

      .order(

        "sold_at",

        {

          ascending:

            false,

        }

      );

  if (error) {

    throw error;

  }

  return (

    data || []

  ).map(

    fromSaleRow

  );

}

export async function getCloudSaleByBillId(

  billId

) {

  const {

    data,

    error,

  } =

    await supabase

      .from("sales")

      .select(`

        *,

        sale_items (

          id,

          product_id,

          product_name,

          option_name,

          qty,

          unit_price,

          unit_cost,

          subtotal,

          cost_total,

          profit

        )

      `)

      .eq(

        "bill_id",

        billId

      )

      .maybeSingle();

  if (error) {

    throw error;

  }

  return data

    ? fromSaleRow(

        data

      )

    : null;

}

export async function deleteCloudSale(

  cloudSaleId

) {

  /*

    Foreign Key ตอนนี้

    ยังเป็น No action

    จึงลบรายการสินค้า

    ก่อนลบหัวบิล

  */

  const {

    error:

      itemError,

  } =

    await supabase

      .from(

        "sale_items"

      )

      .delete()

      .eq(

        "sale_id",

        cloudSaleId

      );

  if (itemError) {

    throw itemError;

  }

  const {

    error:

      saleError,

  } =

    await supabase

      .from("sales")

      .delete()

      .eq(

        "id",

        cloudSaleId

      );

  if (saleError) {

    throw saleError;

  }

  return true;

}
