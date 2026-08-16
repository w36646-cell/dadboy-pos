import {

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  getCloudSales,

} from "../services/salesService";

import {

  getCloudProducts,

} from "../services/productService";
 

import "./DashboardPage.css";

const SALES_KEY =

  "dadboy_sales_v1";

const STOCK_KEY =

  "dadboy_inventory_v2";

const PRODUCTS_KEY =

  "dadboy_products_v1";

function readStorage(

  key,

  fallback

) {

  try {

    const saved =

      localStorage.getItem(

        key

      );

    return saved

      ? JSON.parse(saved)

      : fallback;

  } catch {

    return fallback;

  }

}

function formatDateKey(

  date

) {

  return date.toLocaleDateString(

    "en-CA"

  );

}

function summarize(

  saleList

) {

  return saleList.reduce(

    (

      result,

      sale

    ) => {

      result.totalAmount +=

        Number(

          sale.totalAmount ||

            0

        );

      result.totalCost +=

        Number(

          sale.totalCost ||

            0

        );

      result.totalProfit +=

        Number(

          sale.totalProfit ||

            0

        );

      result.totalQty +=

        Number(

          sale.totalQty ||

            0

        );

      return result;

    },

    {

      totalAmount: 0,

      totalCost: 0,

      totalProfit: 0,

      totalQty: 0,

    }

  );

}

function DashboardPage({

  onOpenStock,

}) {

  const [

    sales,

    setSales,

  ] = useState([]);

  const [

    inventory,

    setInventory,

  ] = useState(() =>

    readStorage(

      STOCK_KEY,

      {}

    )

  );

  const [

    products,

    setProducts,

  ] = useState(() =>

    readStorage(

      PRODUCTS_KEY,

      []

    )

  );

  const [

    cloudError,

    setCloudError,

  ] = useState(false);

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

  selectedDate,

  setSelectedDate,

] = useState(

  formatDateKey(

    new Date()

  )

);
 
 async function reloadStockData() {

  try {

    const cloudProducts =

      await getCloudProducts();

    const cloudInventory = {};

    cloudProducts.forEach(

      (product) => {

        cloudInventory[
product.id

        ] =

          Number(

            product.stock ?? 0

          );

      }

    );

    setProducts(

      cloudProducts

    );

    setInventory(

      cloudInventory

    );

    localStorage.setItem(

      PRODUCTS_KEY,

      JSON.stringify(

        cloudProducts

      )

    );

    localStorage.setItem(

      STOCK_KEY,

      JSON.stringify(

        cloudInventory

      )

    );

  } catch (error) {

    console.error(

      "Dashboard Cloud stock error:",

      error

    );

    setInventory(

      readStorage(

        STOCK_KEY,

        {}

      )

    );

    setProducts(

      readStorage(

        PRODUCTS_KEY,

        []

      )

    );

  }

}

  async function reloadSales() {

    try {

      const cloudSales =

        await getCloudSales();

      /*

        ถ้า Cloud โหลดสำเร็จ

        ใช้ Cloud อย่างเดียว 100%

        ไม่รวมกับ LocalStorage

      */

      setSales(

        Array.isArray(

          cloudSales

        )

          ? cloudSales

          : []

      );

      setCloudError(

        false

      );

      console.log(

        "Dashboard: ใช้ยอดขายจาก Supabase",

        cloudSales.length

      );

    } catch (error) {

      console.error(

        "Dashboard Cloud sales error:",

        error

      );

      /*

        fallback เฉพาะตอน Cloud ใช้งานไม่ได้

      */

      const localSales =

        readStorage(

          SALES_KEY,

          []

        );

      setSales(

        Array.isArray(

          localSales

        )

          ? localSales

          : []

      );

      setCloudError(

        true

      );

    } finally {

      setLoading(

        false

      );

    }

  }

  useEffect(() => {

  reloadStockData();

  reloadSales();

  const timer =

    setInterval(() => {

      reloadStockData();

      reloadSales();

    }, 600000);

  function handleFocus() {

    reloadStockData();

    reloadSales();

  }

  function handleStorage() {

    reloadStockData();

  }

  window.addEventListener(

    "focus",

    handleFocus

  );

  window.addEventListener(

    "storage",

    handleStorage

  );

  return () => {

    clearInterval(

      timer

    );

    window.removeEventListener(

      "focus",

      handleFocus

    );

    window.removeEventListener(

      "storage",

      handleStorage

    );

  };

}, []);
 
 const selectedSales =

  useMemo(() => {

    return sales.filter(

      (sale) =>

        sale.soldDate ===

        selectedDate

    );

  }, [

    sales,

    selectedDate,

  ]);
 
  const summary =

    useMemo(() => {

      return summarize(

        selectedSales

      );

    }, [

      selectedSales,

    ]);

  const averageBill =

    selectedSales.length >

    0

      ? summary.totalAmount /

        selectedSales.length

      : 0;

  const margin =

    summary.totalAmount >

    0

      ? (

          summary.totalProfit /

          summary.totalAmount

        ) * 100

      : 0;

  const topProducts =

    useMemo(() => {

      const result =

        {};

      selectedSales.forEach(

        (sale) => {

          sale.items?.forEach(

            (item) => {

              const key =

                `${item.productId}-${item.option}`;

              if (

                !result[key]

              ) {

                result[key] =

                  {

                    name:

                      item.productName,

                    option:

                      item.option,

                    quantity:

                      0,

                    amount:

                      0,

                  };

              }

              result[

                key

              ].quantity +=

                Number(

                  item.quantity ||

                    0

                );

              result[

                key

              ].amount +=

                Number(

                  item.lineTotal ||

                    0

                );

            }

          );

        }

      );

      return Object.values(

        result

      )

        .sort(

          (

            a,

            b

          ) =>

            b.quantity -

            a.quantity

        )

        .slice(

          0,

          5

        );

    }, [

      selectedSales,

    ]);

  const lowStockProducts =

    useMemo(() => {

      return products

        .map(

          (

            product

          ) => {

            const stock =

              Number(

                inventory[
product.id

                ] ??

                  product.stock ??

                  50

              );

            const minStock =

              Number(

                product.minStock ??

                  5

              );

            const trackStock =

              product.trackStock !==

              false;

            return {

              ...product,

              stock,

              minStock,

              trackStock,

            };

          }

        )

        .filter(

          (

            product

          ) =>

            product.trackStock &&

            product.stock <=

              product.minStock

        )

        .sort(

          (

            a,

            b

          ) => {

            const aGap =

              a.stock -

              a.minStock;

            const bGap =

              b.stock -

              b.minStock;

            return (

              aGap -

              bGap

            );

          }

        );

    }, [

      products,

      inventory,

    ]);

  const stockValue =

    useMemo(() => {

      return products.reduce(

        (

          total,

          product

        ) => {

          const stock =

            Number(

              inventory[
product.id

              ] ??

                product.stock ??

                0

            );

          const cost =

            Number(

              product.cost ||

                0

            );

          return (

            total +

            Math.max(

              stock,

              0

            ) *

              cost

          );

        },

        0

      );

    }, [

      products,

      inventory,

    ]);

  const hourlySales =

    useMemo(() => {

      const hours =

        Array.from(

          {

            length:

              16,

          },

          (

            _,

            index

          ) => ({

            hour:

              index +

              7,

            amount:

              0,

          })

        );

      selectedSales.forEach(

        (sale) => {

          let hour =

            null;

          /*

            ใช้ soldTime ก่อน

            เพราะเป็นเวลาไทยจาก POS

          */

          if (

            sale.soldTime

          ) {

            const text =

              String(

                sale.soldTime

              );

            const match =

              text.match(

                /(\d{1,2})[:.]/

              );

            if (

              match

            ) {

              hour =

                Number(

                  match[1]

                );

            }

          }

          if (

            hour ===

            null

          ) {

            const saleDate =

              new Date(

                sale.soldAt

              );

            if (

              !Number.isNaN(

                saleDate.getTime()

              )

            ) {

              hour =

                saleDate.getHours();

            }

          }

          if (

            hour ===

            null

          ) {

            return;

          }

          const target =

            hours.find(

              (

                item

              ) =>

                item.hour ===

                hour

            );

          if (

            target

          ) {

            target.amount +=

              Number(

                sale.totalAmount ||

                  0

              );

          }

        }

      );

      return hours;

    }, [

      selectedSales,

    ]);

  const maxHourlyAmount =

    Math.max(

      1,

      ...hourlySales.map(

        (item) =>

          item.amount

      )

    );

  const last7Days =

    useMemo(() => {

      const result =

        [];

      for (

        let index =

          6;

        index >= 0;

        index -= 1

      ) {

        const date =

          new Date();

        date.setHours(

          0,

          0,

          0,

          0

        );

        date.setDate(

          date.getDate() -

            index

        );

        const key =

          formatDateKey(

            date

          );

        const daySales =

          sales.filter(

            (

              sale

            ) =>

              sale.soldDate ===

              key

          );

        const daySummary =

          summarize(

            daySales

          );

        result.push({

          key,

          label:

            date.toLocaleDateString(

              "th-TH",

              {

                weekday:

                  "short",

              }

            ),

          amount:

            daySummary.totalAmount,

          profit:

            daySummary.totalProfit,

        });

      }

      return result;

    }, [

      sales,

    ]);

  const max7DayAmount =

    Math.max(

      1,

      ...last7Days.map(

        (day) =>

          day.amount

      )

    );

  const max7DayProfit =

    Math.max(

      1,

      ...last7Days.map(

        (day) =>

          day.profit

      )

    );

  function goToStock() {

    if (

      typeof onOpenStock ===

      "function"

    ) {

      onOpenStock();

    }

  }

  return (
<div className="db-page">
<div className="db-header">
<div>
<h1>

            Dashboard
</h1>
<p>

            ภาพรวมร้านตามวันที่เลือก
</p>
</div>
<div className="db-header-right">
<input

    className="db-date-picker"

    type="date"

    value={selectedDate}

    onChange={(event) =>

      setSelectedDate(

        event.target.value

      )

    }

  />
<div className="db-live">
<span />

    {loading

      ? "LOADING"

      : cloudError

        ? "LOCAL"

        : "CLOUD"}
</div>
</div>
 
      {cloudError && (
<div

          style={{

            marginBottom:

              "12px",

            padding:

              "10px 14px",

            borderRadius:

              "10px",

            background:

              "#fff3cd",

            color:

              "#664d03",

            fontSize:

              "13px",

          }}
>

          Cloud เชื่อมต่อไม่สำเร็จ

          Dashboard กำลังใช้ข้อมูลสำรองจากเครื่อง
</div>

      )}

      {lowStockProducts.length >

        0 && (
<button

          type="button"

          className="db-stock-alert"

          onClick={

            goToStock

          }
>
<div className="db-stock-alert-icon">

            ⚠️
</div>
<div className="db-stock-alert-content">
<strong>

              สินค้าใกล้หมด{" "}

              {

                lowStockProducts.length

              }{" "}

              รายการ
</strong>
<span>

              {lowStockProducts

                .slice(

                  0,

                  3

                )

                .map(

                  (

                    product

                  ) =>

                    `${product.name} ${product.stock}/${product.minStock}`

                )

                .join(

                  " • "

                )}

              {lowStockProducts.length >

              3

                ? ` • +${

                    lowStockProducts.length -

                    3

                  } รายการ`

                : ""}
</span>
</div>
<div className="db-stock-alert-arrow">

            ›
</div>
</button>

      )}
<div className="db-summary-grid">
<div className="db-card">
<span>

            ยอดขายวันที่เลือก
</span>
<strong>

            {summary.totalAmount.toLocaleString()}{" "}

            บาท
</strong>
</div>
<div className="db-card">
<span>

            กำไรวันที่เลือก
</span>
<strong>

            {summary.totalProfit.toLocaleString()}{" "}

            บาท
</strong>
</div>
<div className="db-card">
<span>

            จำนวนบิล
</span>
<strong>

            {

              selectedSales.length

            }{" "}

            บิล
</strong>
<small>

            เฉลี่ย{" "}

            {averageBill.toLocaleString(

              undefined,

              {

                maximumFractionDigits:

                  0,

              }

            )}{" "}

            บาท/บิล
</small>
</div>
<div className="db-card">
<span>

            ขายได้ทั้งหมด
</span>
<strong>

            {

              summary.totalQty

            }{" "}

            ชิ้น
</strong>
<small>

            Margin{" "}

            {margin.toFixed(

              1

            )}

            %
</small>
</div>
</div>
<div className="db-kpi-grid">
<div className="db-kpi">
<span>

            มูลค่าสต๊อก
</span>
<strong>

            {stockValue.toLocaleString()}{" "}

            บาท
</strong>
</div>
<div className="db-kpi">
<span>

            สินค้าขายดี
</span>
<strong>

            {topProducts[0]

              ?.name ||

              "-"}
</strong>
</div>
<div className="db-kpi">
<span>

            สินค้าใกล้หมด
</span>
<strong>

            {

              lowStockProducts.length

            }{" "}

            รายการ
</strong>
</div>
<div className="db-kpi">
<span>

            สินค้าทั้งหมด
</span>
<strong>

            {

              products.length

            }{" "}

            รายการ
</strong>
</div>
</div>
<div className="db-main-grid">
<section className="db-box">
<div className="db-box-title">
<h2>

              สินค้าขายดีวันที่เลือก
</h2>
</div>

          {topProducts.length ===

          0 ? (
<div className="db-empty">

              ยังไม่มีข้อมูลการขาย
</div>

          ) : (

            topProducts.map(

              (

                item,

                index

              ) => (
<div

                  className="db-ranking"

                  key={`${item.name}-${item.option}`}
>
<div className="db-rank">

                    {index +

                      1}
</div>
<div className="db-product">
<strong>

                      {

                        item.name

                      }
</strong>
<span>

                      {

                        item.option

                      }
</span>
</div>
<div className="db-product-value">
<strong>

                      {

                        item.quantity

                      }{" "}

                      ชิ้น
</strong>
<span>

                      {item.amount.toLocaleString()}{" "}

                      บาท
</span>
</div>
</div>

              )

            )

          )}
</section>
<section className="db-box">
<div className="db-box-title">
<h2>

              สินค้าใกล้หมดปัจจุบัน
</h2>
</div>

          {lowStockProducts.length ===

          0 ? (
<div className="db-empty">

              ไม่มีสินค้าใกล้หมด
</div>

          ) : (

            <button

  type="button"

  className="db-low-stock-compact"

  onClick={goToStock}
>

  {lowStockProducts

    .map(

      (product) =>

        `${product.name} (${product.stock})`

    )

    .join(" • ")}
</button>
 
          )}
</section>
</div>
<section className="db-box db-hourly">
<div className="db-box-title">
<h2>

            ยอดขายรายชั่วโมง
</h2>
</div>
<div className="db-hourly-list">

          {hourlySales.map(

            (item) => (
<div

                className="db-hour-row"

                key={

                  item.hour

                }
>
<span>

                  {String(

                    item.hour

                  ).padStart(

                    2,

                    "0"

                  )}

                  :00
</span>
<div className="db-hour-track">
<div

                    className="db-hour-bar"

                    style={{

                      width: `${

                        item.amount >

                        0

                          ? Math.max(

                              3,

                              (item.amount /

                                maxHourlyAmount) *

                                100

                            )

                          : 0

                      }%`,

                    }}

                  />
</div>
<strong>

                  {item.amount.toLocaleString()}
</strong>
</div>

            )

          )}
</div>
</section>
<div className="db-chart-grid">
<section className="db-box">
<div className="db-box-title">
<h2>

              ยอดขาย 7 วัน
</h2>
</div>
<div className="db-seven-chart">

            {last7Days.map(

              (

                day

              ) => (
<div

                  className="db-day"

                  key={

                    day.key

                  }
>
<div className="db-day-area">
<div

                      className="db-day-bar"

                      style={{

                        height: `${

                          day.amount >

                          0

                            ? Math.max(

                                3,

                                (day.amount /

                                  max7DayAmount) *

                                  100

                              )

                            : 0

                        }%`,

                      }}

                    />
</div>
<strong>

                    {day.amount.toLocaleString()}
</strong>
<span>

                    {

                      day.label

                    }
</span>
</div>

              )

            )}
</div>
</section>
<section className="db-box">
<div className="db-box-title">
<h2>

              กำไร 7 วัน
</h2>
</div>
<div className="db-seven-chart">

            {last7Days.map(

              (

                day

              ) => (
<div

                  className="db-day"

                  key={

                    day.key

                  }
>
<div className="db-day-area">
<div

                      className="db-day-bar profit"

                      style={{

                        height: `${

                          day.profit >

                          0

                            ? Math.max(

                                3,

                                (day.profit /

                                  max7DayProfit) *

                                  100

                              )

                            : 0

                        }%`,

                      }}

                    />
</div>
<strong>

                    {day.profit.toLocaleString()}
</strong>
<span>

                    {

                      day.label

                    }
</span>
</div>

              )

            )}
</div>
</section>
</div>
</div>

  );

}

.db-date-picker {

  padding: 8px 10px;

  border: 1px solid #d0d5dd;

  border-radius: 10px;

  background: #ffffff;

  color: #222222;

  font-size: 13px;

}

.db-low-stock-compact {

  width: 100%;

  padding: 12px 14px;

  border: 0;

  border-radius: 10px;

  background: #fff7df;

  color: #7a5a14;

  text-align: left;

  line-height: 1.7;

  font-size: 13px;

  cursor: pointer;

}

.db-low-stock-compact:hover {

  background: #fff1c7;

}

@media (max-width: 520px) {

  .db-header-right {

    display: flex;

    flex-direction: column;

    align-items: flex-end;

    gap: 6px;

  }

  .db-date-picker {

    max-width: 145px;

    padding: 7px 8px;

    font-size: 12px;

  }

  .db-low-stock-compact {

    padding: 10px 11px;

    font-size: 12px;

  }

}
 
export default DashboardPage;
