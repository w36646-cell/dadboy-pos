import { supabase } from "../lib/supabase";


function sleep(ms) {

  return new Promise((resolve) => {

    window.setTimeout(resolve, ms);

  });

}


async function withRetry(

  request,

  attempts = 2

) {

  let lastError = null;

  for (

    let attempt = 0;

    attempt < attempts;

    attempt += 1

  ) {

    try {

      return await request();

    } catch (error) {

      lastError = error;

      if (

        attempt <

        attempts - 1

      ) {

        await sleep(500);

      }

    }

  }

  throw lastError;

}


function fromSaleItemRow(row) {

  const quantity = Number(

    row.qty || 0

  );

  const stockPerUnit = Math.max(

    1,

    Number(

      row.stock_per_unit ?? 1

    ) || 1

  );

  const stockQuantity =

    Number(

      row.stock_quantity ??

        quantity *

          stockPerUnit

    );

  return {

    id: row.id,

    lineId:

      row.line_id ||

      `legacy-${row.id}`,

    productId:

      row.product_id,

    productName:

      row.product_name || "",

    option:

      row.option_name || "",

    saleType:

      row.sale_type ||

      (

        stockPerUnit > 1

          ? "pack"

          : "unit"

      ),

    stockPerUnit,

    stockQuantity,

    quantity,

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

    (

      item,

      index

    ) => {
 

    const quantity =

      Number(

        item.quantity || 0

      );

    const stockPerUnit =

      Math.max(

        1,

        Number(

          item.stockPerUnit ??

            1

        ) || 1

      );

    const stockQuantity =

      Number(

        item.stockQuantity ??

          quantity *

            stockPerUnit

      );

    const saleType =

      item.saleType ||

      (

        stockPerUnit > 1

          ? "pack"

          : "unit"

      );

    return {

      sale_id:

        saleId,

      line_id:

        String(

          item.lineId ||

          item.cartLineId ||

          `legacy-${String(

            item.productId

          )}-${index}`

        ),

      product_id:

        String(

          item.productId

        ),

      product_name:

        item.productName ||

        "",

      option_name:

        item.option || "",

      sale_type:

        saleType,

      stock_per_unit:

        stockPerUnit,

      stock_quantity:

        stockQuantity,

      qty:

        quantity,

      unit_price:

        Number(

          item.unitPrice || 0

        ),

      unit_cost:

        Number(

          item.unitCost || 0

        ),

      subtotal:

        Number(

          item.lineTotal || 0

        ),

      cost_total:

        Number(

          item.lineCost || 0

        ),

      profit:

        Number(

          item.lineProfit || 0

        ),

    };

  });

}

/*

  =========================================

  โหลดรายการสินค้าแยกจากหัวบิล

  แยก request เพื่อให้มือถือไม่ต้องรับ

  nested response ขนาดใหญ่ในครั้งเดียว

  =========================================

*/

async function loadSaleRows() {

  return withRetry(

    async () => {

      const {

        data,

        error,

      } =

        await supabase

          .from("sales")

          .select(`

            id,

            bill_id,

            sold_at,

            sold_date,

            sold_time,

            total_qty,

            total_amount,

            total_cost,

            total_profit

          `)

          .order(

            "sold_at",

            {

              ascending: false,

            }

          );

      if (error) {

        throw error;

      }

      return data || [];

    }

  );

}


async function loadSaleItemRows() {

  return withRetry(

    async () => {

      const {

        data,

        error,

      } =

        await supabase

          .from("sale_items")

          .select(`

            id,

            line_id,

            sale_id,

            product_id,

            product_name,

            option_name,

            sale_type,

            stock_per_unit,

            stock_quantity,

            qty,

            unit_price,

            unit_cost,

            subtotal,

            cost_total,

            profit

          `)

          .order(

            "id",

            {

              ascending: true,

            }

          );

      if (error) {

        throw error;

      }

      return data || [];

    }

  );

}


async function loadSaleItemsBySaleIds(

  saleIds

) {

  if (

    !Array.isArray(saleIds) ||

    saleIds.length === 0

  ) {

    return [];

  }

  return withRetry(

    async () => {

      const {

        data,

        error,

      } =

        await supabase

          .from("sale_items")

          .select(`

            id,

            line_id,

            sale_id,

            product_id,

            product_name,

            option_name,

            sale_type,

            stock_per_unit,

            stock_quantity,

            qty,

            unit_price,

            unit_cost,

            subtotal,

            cost_total,

            profit

          `)

          .in(

            "sale_id",

            saleIds

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

      return data || [];

    }

  );

}


function combineSalesAndItems(

  saleRows,

  itemRows

) {

  const itemsBySaleId =

    new Map();

  (

    itemRows || []

  ).forEach((item) => {

    const key =

      String(

        item.sale_id

      );

    if (

      !itemsBySaleId.has(

        key

      )

    ) {

      itemsBySaleId.set(

        key,

        []

      );

    }

    itemsBySaleId

      .get(key)

      .push(item);

  });

  return (

    saleRows || []

  ).map((sale) => ({

    ...sale,

    sale_items:

      itemsBySaleId.get(

        String(sale.id)

      ) || [],

  }));

}


/*

  สำหรับหน้า Bills เท่านั้น

  โหลดครั้งละ 50 บิล

  ไม่ดึงประวัติทั้งหมด

*/

export async function getCloudSalesPage(

  offset = 0,

  limit = 50

) {

  const safeOffset =

    Math.max(

      0,

      Number(offset) || 0

    );

  const safeLimit =

    Math.max(

      1,

      Number(limit) || 50

    );

  /*

    โหลดเกินมา 1 บิล

    เพื่อดูว่ายังมีหน้าถัดไปหรือไม่

  */

  const {

    data,

    error,

  } =

    await supabase

      .from("sales")

      .select(`

        id,

        bill_id,

        sold_at,

        sold_date,

        sold_time,

        total_qty,

        total_amount,

        total_cost,

        total_profit

      `)

      .order(

        "sold_at",

        {

          ascending: false,

        }

      )

      .range(

        safeOffset,

        safeOffset + safeLimit

      );

  if (error) {

    throw error;

  }

  const rows =

    data || [];

  const hasMore =

    rows.length >

    safeLimit;

  const pageRows =

    rows.slice(

      0,

      safeLimit

    );

  const saleIds =

    pageRows.map(

      (sale) =>
sale.id

    );

  const itemRows =

    await loadSaleItemsBySaleIds(

      saleIds

    );

  const combined =

    combineSalesAndItems(

      pageRows,

      itemRows

    );

  return {

    sales:

      combined.map(

        fromSaleRow

      ),

    hasMore,

  };

}

/*

  โหลดเฉพาะหัวบิลตามช่วงเวลาที่กำหนด

  ใช้สำหรับยอดขายรายวันหน้า POS

  ไม่โหลด sale_items

  ไม่โหลดประวัติบิลทั้งหมด

*/

export async function getCloudTodaySales(

  startIso,

  endIso

) {

  return withRetry(

    async () => {

      const {

        data,

        error,

      } =

        await supabase

          .from("sales")

          .select(`

            id,

            bill_id,

            sold_at,

            sold_date,

            sold_time,

            total_qty,

            total_amount,

            total_cost,

            total_profit

          `)

          .gte(

            "sold_at",

            startIso

          )

          .lt(

            "sold_at",

            endIso

          )

          .order(

            "sold_at",

            {

              ascending: false,

            }

          );

      if (error) {

        throw error;

      }

      return (

        data || []

      ).map(

        (row) =>

          fromSaleRow({

            ...row,

            sale_items: [],

          })

      );

    }

  );

}

/*

  =========================================

  โหลด Sales สำหรับ Dashboard แบบประหยัด

  1. กราฟ:

     โหลดเฉพาะหัวบิล

     ตั้งแต่วันจันทร์ของอาทิตย์ที่แล้ว

     ถึงวันนี้

  2. วันที่ที่ผู้ใช้เลือก:

     โหลด sale_items เฉพาะวันนั้น

  3. ไม่โหลดประวัติทั้งหมด

  =========================================

*/

/*

  =========================================

  โหลด Sales ตามช่วงวันที่สำหรับ Report

  - โหลดเฉพาะหัวบิลในช่วงวันที่เลือก

  - โหลด sale_items เฉพาะบิลเหล่านั้น

  - ไม่โหลดประวัติทั้งหมด

  =========================================

*/

export async function getCloudSalesRange(

  startDate,

  endDate

) {

  const safeStartDate =

    String(

      startDate || ""

    ).slice(

      0,

      10

    );

  const safeEndDate =

    String(

      endDate || ""

    ).slice(

      0,

      10

    );

  const datePattern =

    /^\d{4}-\d{2}-\d{2}$/;

  if (

    !datePattern.test(

      safeStartDate

    ) ||

    !datePattern.test(

      safeEndDate

    )

  ) {

    throw new Error(

      `Invalid report date range: ${startDate} - ${endDate}`

    );

  }

  if (

    safeStartDate >

    safeEndDate

  ) {

    return [];

  }

  const saleRows =

    await withRetry(

      async () => {

        const {

          data,

          error,

        } =

          await supabase

            .from(

              "sales"

            )

            .select(`

              id,

              bill_id,

              sold_at,

              sold_date,

              sold_time,

              total_qty,

              total_amount,

              total_cost,

              total_profit

            `)

            .gte(

              "sold_date",

              safeStartDate

            )

            .lte(

              "sold_date",

              safeEndDate

            )

            .order(

              "sold_at",

              {

                ascending: false,

              }

            );

        if (error) {

          throw error;

        }

        return data || [];

      }

    );

  const saleIds =

    saleRows.map(

      (sale) =>
sale.id

    );

  const itemRows =

    await loadSaleItemsBySaleIds(

      saleIds

    );

  const combinedRows =

    combineSalesAndItems(

      saleRows,

      itemRows

    );

  return combinedRows.map(

    fromSaleRow

  );

}

export async function getCloudDashboardSales(

  selectedDate

) {

  const safeSelectedDate =

    String(

      selectedDate || ""

    ).slice(

      0,

      10

    );

  if (

    !/^\d{4}-\d{2}-\d{2}$/.test(

      safeSelectedDate

    )

  ) {

    throw new Error(

      `Invalid dashboard date: ${selectedDate}`

    );

  }

  function toDateKey(

    date

  ) {

    const year =

      date.getFullYear();

    const month =

      String(

        date.getMonth() + 1

      ).padStart(

        2,

        "0"

      );

    const day =

      String(

        date.getDate()

      ).padStart(

        2,

        "0"

      );

    return `${year}-${month}-${day}`;

  }


  /*

    หาวันจันทร์ของอาทิตย์นี้

  */

  const today =

    new Date();

  today.setHours(

    0,

    0,

    0,

    0

  );

  const dayOfWeek =

    today.getDay();

  const daysFromMonday =

    dayOfWeek === 0

      ? 6

      : dayOfWeek - 1;

  const thisMonday =

    new Date(

      today

    );

  thisMonday.setDate(

    today.getDate() -

      daysFromMonday

  );


  /*

    วันจันทร์ของอาทิตย์ที่แล้ว

  */

  const lastMonday =

    new Date(

      thisMonday

    );

  lastMonday.setDate(

    thisMonday.getDate() - 7

  );


  const trendStart =

    toDateKey(

      lastMonday

    );

  const trendEnd =

    toDateKey(

      today

    );


  /*

    โหลดหัวบิลสำหรับกราฟ

    ไม่มี sale_items

  */

  const trendRows =

    await withRetry(

      async () => {

        const {

          data,

          error,

        } =

          await supabase

            .from(

              "sales"

            )

            .select(`

              id,

              bill_id,

              sold_at,

              sold_date,

              sold_time,

              total_qty,

              total_amount,

              total_cost,

              total_profit

            `)

            .gte(

              "sold_date",

              trendStart

            )

            .lte(

              "sold_date",

              trendEnd

            )

            .order(

              "sold_at",

              {

                ascending: false,

              }

            );

        if (error) {

          throw error;

        }

        return data || [];

      }

    );


  /*

    ถ้าวันที่เลือกอยู่ในช่วงกราฟแล้ว

    ใช้หัวบิลจาก trendRows ได้เลย

    ไม่ยิง query ซ้ำ

  */

  const selectedInsideTrend =

    safeSelectedDate >=

      trendStart &&

    safeSelectedDate <=

      trendEnd;

  let selectedRows =

    [];


  if (

    selectedInsideTrend

  ) {

    selectedRows =

      trendRows.filter(

        (row) =>

          String(

            row.sold_date || ""

          ).slice(

            0,

            10

          ) ===

          safeSelectedDate

      );

  } else {

    /*

      ถ้าเลือกวันที่เก่ากว่า

      ช่วงกราฟ 14 วัน

      โหลดเฉพาะวันนั้นเพิ่ม

    */

    selectedRows =

      await withRetry(

        async () => {

          const {

            data,

            error,

          } =

            await supabase

              .from(

                "sales"

              )

              .select(`

                id,

                bill_id,

                sold_at,

                sold_date,

                sold_time,

                total_qty,

                total_amount,

                total_cost,

                total_profit

              `)

              .eq(

                "sold_date",

                safeSelectedDate

              )

              .order(

                "sold_at",

                {

                  ascending: false,

                }

              );

          if (error) {

            throw error;

          }

          return data || [];

        }

      );

  }


  /*

    โหลดรายการสินค้า

    เฉพาะบิลของวันที่เลือก

  */

  const selectedSaleIds =

    selectedRows.map(

      (row) =>
row.id

    );

  const selectedItemRows =

    await loadSaleItemsBySaleIds(

      selectedSaleIds

    );


  /*

    รวม items เข้ากับบิล

    ของวันที่เลือก

  */

  const selectedCombined =

    combineSalesAndItems(

      selectedRows,

      selectedItemRows

    ).map(

      fromSaleRow

    );


  /*

    กราฟใช้เฉพาะหัวบิล

    ไม่ต้องมี items

  */

  const result =

    new Map();


  trendRows.forEach(

    (row) => {

      result.set(

        String(
row.id

        ),

        fromSaleRow({

          ...row,

          sale_items: [],

        })

      );

    }

  );


  /*

    ถ้าวันที่เลือกทับกับช่วงกราฟ

    ให้ข้อมูลแบบละเอียด

    เขียนทับหัวบิลเดิม

    ป้องกันบิลซ้ำ

  */

  selectedCombined.forEach(

    (sale) => {

      result.set(

        String(
sale.id

        ),

        sale

      );

    }

  );


  return Array.from(

    result.values()

  );

}

/*

  =========================================

  Atomic Sale

  บันทึกพร้อมกันใน Transaction เดียว:

  - sales

  - sale_items

  - products.stock

  - stock_operations

  Bill เดิม Retry ซ้ำได้

  Stock จะไม่ถูกตัดซ้ำ

  =========================================

*/

export async function saveCloudSaleWithStock(

  sale

) {

  if (!sale?.billId) {

    throw new Error(

      "Sale billId is required"

    );

  }


  return withRetry(

    async () => {

      const {

        data,

        error,

      } =

        await supabase

          .rpc(

            "save_sale_with_stock_once",

            {

              p_sale:

                sale,

            }

          );


      if (error) {

        throw error;

      }


      if (!data) {

        throw new Error(

          `Atomic sale returned no data: ${sale.billId}`

        );

      }


      const saleId =

        Number(

          data.saleId || 0

        );


      if (

        !Number.isFinite(

          saleId

        ) ||

        saleId <= 0

      ) {

        throw new Error(

          `Atomic sale returned invalid saleId: ${sale.billId}`

        );

      }


      return {

        ...sale,

        id:

          saleId,

        cloudId:

          saleId,

        cloudStocks:

          data.stocks &&

          typeof data.stocks ===

            "object"

            ? data.stocks

            : {},

        alreadyApplied:

          data.alreadyApplied ===

          true,

      };

    },

    2

  );

}
 
 export async function saveCloudSale(

  sale

) {

  if (!sale?.billId) {

    throw new Error(

      "Sale billId is required"

    );

  }

  /*

    =========================

    1. บันทึกหัวบิล

    =========================

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

    =========================

    2. บันทึกรายการสินค้า

    =========================

  */

  const itemPayload =

    createItemPayload(
saleRow.id,

      sale.items

    );

  if (

    itemPayload.length > 0

  ) {

    const {

      error: itemError,

    } =

      await supabase

        .from(

          "sale_items"

        )

        .upsert(

          itemPayload,

          {

            onConflict:

              "sale_id,line_id",

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


/*

  =========================================

  โหลดบิลทั้งหมด

  เวอร์ชันใหม่:

  1. โหลด sales

  2. โหลด sale_items

  3. รวมข้อมูลใน Browser

  เหมาะกับมือถือมากกว่า nested query เดิม

  =========================================

*/

export async function getCloudSales() {

  const [

    saleRows,

    itemRows,

  ] =

    await Promise.all([

      loadSaleRows(),

      loadSaleItemRows(),

    ]);

  const combinedRows =

    combineSalesAndItems(

      saleRows,

      itemRows

    );

  return combinedRows.map(

    fromSaleRow

  );

}


/*

  =========================================

  โหลดบิลเดียวจาก billId

  แยก query เช่นเดียวกับด้านบน

  =========================================

*/

export async function getCloudSaleByBillId(

  billId

) {

  const {

    data: saleRow,

    error: saleError,

  } =

    await supabase

      .from("sales")

      .select(`

        id,

        bill_id,

        sold_at,

        sold_date,

        sold_time,

        total_qty,

        total_amount,

        total_cost,

        total_profit

      `)

      .eq(

        "bill_id",

        billId

      )

      .maybeSingle();

  if (saleError) {

    throw saleError;

  }

  if (!saleRow) {

    return null;

  }

  const {

    data: itemRows,

    error: itemError,

  } =

    await supabase

      .from("sale_items")

      .select(`

        id,

        line_id,

        sale_id,

        product_id,

        product_name,

        option_name,

        sale_type,

        stock_per_unit,

        stock_quantity,

        qty,

        unit_price,

        unit_cost,

        subtotal,

        cost_total,

        profit

      `)

      .eq(

        "sale_id",
saleRow.id

      )

      .order(

        "id",

        {

          ascending: true,

        }

      );

  if (itemError) {

    throw itemError;

  }

  return fromSaleRow({

    ...saleRow,

    sale_items:

      itemRows || [],

  });

}


export async function deleteCloudSale(

  cloudSaleId

) {

  /*

    Foreign Key ตอนนี้ยังเป็น No action

    จึงลบรายการสินค้าก่อนลบหัวบิล

  */

  const {

    error: itemError,

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

    error: saleError,

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


export async function updateCloudSaleAfterItemDelete(

  sale,

  itemToDelete

) {

  if (!sale?.id) {

    throw new Error(

      "Cloud sale id is required"

    );

  }

  if (!itemToDelete?.id) {

    throw new Error(

      "Cloud sale item id is required"

    );

  }

  const remainingItems =

    (

      sale.items || []

    ).filter(

      (item) =>

        String(item.id) !==

        String(
itemToDelete.id

        )

    );

  const totalQty =

    remainingItems.reduce(

      (

        sum,

        item

      ) =>

        sum +

        Number(

          item.stockQuantity ??

            item.quantity ??

            0

        ),

      0

    );

  const totalAmount =

    remainingItems.reduce(

      (

        sum,

        item

      ) =>

        sum +

        Number(

          item.lineTotal ||

            0

        ),

      0

    );

  const totalCost =

    remainingItems.reduce(

      (

        sum,

        item

      ) =>

        sum +

        Number(

          item.lineCost ||

            0

        ),

      0

    );

  const totalProfit =

    totalAmount -

    totalCost;

  const {

    error: itemError,

  } =

    await supabase

      .from(

        "sale_items"

      )

      .delete()

      .eq(

        "id",
itemToDelete.id

      );

  if (itemError) {

    throw itemError;

  }

  const {

    error: saleError,

  } =

    await supabase

      .from("sales")

      .update({

        total_qty:

          totalQty,

        total_amount:

          totalAmount,

        total_cost:

          totalCost,

        total_profit:

          totalProfit,

      })

      .eq(

        "id",
sale.id

      );

  if (saleError) {

    throw saleError;

  }

  return {

    ...sale,

    items:

      remainingItems,

    totalQty,

    totalAmount,

    totalCost,

    totalProfit,

  };

}
