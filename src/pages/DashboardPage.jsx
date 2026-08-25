import { useCallback, useEffect, useMemo, useState } from "react";

import { getCloudDashboardSales } from "../services/salesService";

import { getCloudDashboardProducts } from "../services/productService";

import "./DashboardPage.css";

function formatDateKey(date) {

  const year = date.getFullYear();

  const month = String(date.getMonth() + 1).padStart(2, "0");

  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;

}

function summarize(saleList) {

  return saleList.reduce(

    (result, sale) => {

      result.totalAmount += Number(sale.totalAmount || 0);

      result.totalCost += Number(sale.totalCost || 0);

      result.totalProfit += Number(sale.totalProfit || 0);

      result.totalQty += Number(sale.totalQty || 0);

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

function DashboardPage({ onOpenStock }) {

  const [sales, setSales] = useState([]);

  const [products, setProducts] = useState([]);

  const [inventory, setInventory] = useState({});

  const [selectedDate, setSelectedDate] = useState(() =>

    formatDateKey(new Date())

  );

  const [loading, setLoading] = useState(true);

  const [salesCloudError, setSalesCloudError] = useState(false);

  const [stockCloudError, setStockCloudError] = useState(false);

  /*

    STOCK:

    ใช้ Cloud เป็นข้อมูลจริงเท่านั้น

    ไม่ fallback stock จาก localStorage

    เพื่อป้องกันมือถือ/คอมแสดงยอดคนละชุด

  */

  const reloadStockData = useCallback(async () => {

    try {

      const cloudProducts = await getCloudDashboardProducts();

      const safeProducts = Array.isArray(cloudProducts)

        ? cloudProducts

        : [];

      const cloudInventory = {};

      safeProducts.forEach((product) => {

        cloudInventory[product.id] = Number(product.stock ?? 0);

      });

      setProducts(safeProducts);

      setInventory(cloudInventory);

      setStockCloudError(false);

      return true;

    } catch (error) {

      console.error("Dashboard Cloud stock error:", error);

      setStockCloudError(true);

      return false;

    }

  }, []);

 /*

  SALES:

  Dashboard โหลดเฉพาะข้อมูลที่จำเป็น

  - หัวบิลสำหรับกราฟย้อนหลัง

  - sale_items เฉพาะวันที่เลือก

  Cloud เป็นข้อมูลหลัก

  ไม่เก็บประวัติ Sales ทั้งหมดใน localStorage

*/

const reloadSales =

  useCallback(

    async () => {

      try {

        const cloudSales =

          await getCloudDashboardSales(

            selectedDate

          );

        const safeSales =

          Array.isArray(

            cloudSales

          )

            ? cloudSales

            : [];

        setSales(

          safeSales

        );

        setSalesCloudError(

          false

        );

        return true;

      } catch (error) {

        console.error(

          "Dashboard Cloud sales error:",

          error

        );

        /*

          ไม่เอาประวัติ Sales เก่า

          จาก localStorage มาใช้แล้ว

          ถ้ามีข้อมูลเดิมบนหน้าจอ

          ให้คงไว้ก่อน

        */

        setSalesCloudError(

          true

        );

        return false;

      }

    },

    [

      selectedDate,

    ]

  );
 
      setSales(safeSales);

      setSalesCloudError(false);

      /*

        Cache แยก try ออกมาต่างหาก

        ห้าม cache error ทำให้ Cloud error

      */

      writeStorage(SALES_KEY, safeSales);

      return true;

    } catch (error) {

      console.error("Dashboard Cloud sales error:", error);

      const localSales = readStorage(SALES_KEY, []);

      setSales(

        Array.isArray(localSales)

          ? localSales

          : []

      );

      setSalesCloudError(true);

      return false;

    }

  }, []);

  /*

    โหลด:

    - เปิด Dashboard

    - ทุก 10 นาที

    - กลับเข้า tab/app

    - focus หน้าต่าง

  */

  useEffect(() => {

    let active = true;

    async function firstLoad() {

      setLoading(true);

      await Promise.all([

        reloadStockData(),

        reloadSales(),

      ]);

      if (active) {

        setLoading(false);

      }

    }

    firstLoad();

    const timer = window.setInterval(() => {

      reloadStockData();

      reloadSales();

    }, 600000);

    return () => {

      active = false;

      window.clearInterval(timer);

    };

  }, [reloadSales, reloadStockData]);

  /*

    ยอดขายตามวันที่ที่ผู้ใช้เลือก

  */

  const selectedSales = useMemo(() => {

    return sales.filter(

      (sale) =>

        String(sale.soldDate || "").slice(0, 10) ===

        selectedDate

    );

  }, [sales, selectedDate]);

  const summary = useMemo(() => {

    return summarize(selectedSales);

  }, [selectedSales]);

  const averageBill =

    selectedSales.length > 0

      ? summary.totalAmount / selectedSales.length

      : 0;

  const margin =

    summary.totalAmount > 0

      ? (summary.totalProfit / summary.totalAmount) * 100

      : 0;

  /*

    สินค้าขายดีของวันที่เลือก

  */

  const topProducts = useMemo(() => {

    const result = {};

    selectedSales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key =

          `${item.productId}-${item.option || ""}`;

        if (!result[key]) {

          result[key] = {

            name: item.productName || "-",

            option: item.option || "",

            quantity: 0,

            amount: 0,

          };

        }

        result[key].quantity += Number(

          item.quantity || 0

        );

        result[key].amount += Number(

          item.lineTotal || 0

        );

      });

    });

    return Object.values(result)

      .sort((a, b) => b.quantity - a.quantity)

      .slice(0, 5);

  }, [selectedSales]);

  /*

    สินค้าใกล้หมด:

    - ใช้ stock Cloud ปัจจุบัน

    - ไม่เกี่ยวกับ selectedDate

    - แสดงเฉพาะ trackStock === true

    - stock <= minStock เท่านั้น

  */

  const lowStockProducts = useMemo(() => {

    return products

      .map((product) => {

        const stock = Number(

          inventory[product.id] ??

          product.stock ??

          0

        );

        const minStock = Number(

          product.minStock ?? 5

        );

        return {

          ...product,

          stock,

          minStock,

        };

      })

      .filter(

        (product) =>

          product.trackStock === true &&

          product.stock <= product.minStock

      )

      .sort((a, b) => {

        if (a.stock !== b.stock) {

          return a.stock - b.stock;

        }

        return String(a.name || "").localeCompare(

          String(b.name || ""),

          "th"

        );

      });

  }, [products, inventory]);

  /*

    มูลค่า stock ปัจจุบัน

  */

  const stockValue = useMemo(() => {

    return products.reduce((total, product) => {

      const stock = Number(

        inventory[product.id] ??

        product.stock ??

        0

      );

      const cost = Number(product.cost || 0);

      return (

        total +

        Math.max(stock, 0) * cost

      );

    }, 0);

  }, [products, inventory]);

  /*

    ยอดขายรายชั่วโมง

  */

  const hourlySales = useMemo(() => {

    const hours = Array.from(

      { length: 16 },

      (_, index) => ({

        hour: index + 7,

        amount: 0,

      })

    );

    selectedSales.forEach((sale) => {

      let hour = null;

      if (sale.soldTime) {

        const match = String(

          sale.soldTime

        ).match(/(\d{1,2})[:.]/);

        if (match) {

          hour = Number(match[1]);

        }

      }

      if (

        hour === null &&

        sale.soldAt

      ) {

        const saleDate = new Date(

          sale.soldAt

        );

        if (

          !Number.isNaN(

            saleDate.getTime()

          )

        ) {

          hour = saleDate.getHours();

        }

      }

      if (hour === null) {

        return;

      }

      const target = hours.find(

        (item) =>

          item.hour === hour

      );

      if (target) {

        target.amount += Number(

          sale.totalAmount || 0

        );

      }

    });

    return hours;

  }, [selectedSales]);

  const maxHourlyAmount = Math.max(

    1,

    ...hourlySales.map(

      (item) => item.amount

    )

  );

  /*

    กราฟ:

    จันทร์อาทิตย์ที่แล้ว

    ถึงวันนี้ของอาทิตย์นี้

    ไม่สร้างวันที่อนาคต

  */

  const last14Days = useMemo(() => {

    const today = new Date();

    today.setHours(0, 0, 0, 0);

    const dayOfWeek = today.getDay();

    const daysFromMonday =

      dayOfWeek === 0

        ? 6

        : dayOfWeek - 1;

    const thisMonday = new Date(today);

    thisMonday.setDate(

      today.getDate() -

      daysFromMonday

    );

    const lastMonday =

      new Date(thisMonday);

    lastMonday.setDate(

      thisMonday.getDate() - 7

    );

    const result = [];

    for (

      let index = 0;

      index < 14;

      index += 1

    ) {

      const date =

        new Date(lastMonday);

      date.setDate(

        lastMonday.getDate() +

        index

      );

      if (date > today) {

        break;

      }

      const key =

        formatDateKey(date);

      const daySales =

        sales.filter(

          (sale) =>

            String(

              sale.soldDate || ""

            ).slice(0, 10) === key

        );

      const daySummary =

        summarize(daySales);

      result.push({

        key,

        label:

          date.toLocaleDateString(

            "th-TH",

            {

              weekday: "short",

            }

          ),

        dateLabel:

          date.toLocaleDateString(

            "th-TH",

            {

              day: "numeric",

              month: "short",

            }

          ),

        week:

          index < 7

            ? "อาทิตย์ที่แล้ว"

            : "อาทิตย์นี้",

        amount:

          daySummary.totalAmount,

        profit:

          daySummary.totalProfit,

      });

    }

    return result;

  }, [sales]);

  const max14DayAmount =

    Math.max(

      1,

      ...last14Days.map(

        (day) =>

          day.amount

      )

    );

  const max14DayProfit =

    Math.max(

      1,

      ...last14Days.map(

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

  const allCloudReady =

    !salesCloudError &&

    !stockCloudError;

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

              : allCloudReady

                ? "CLOUD"

                : "SYNC ERROR"}
</div>
</div>
</div>

      {stockCloudError && (
<div

          style={{

            marginBottom: "12px",

            padding: "10px 14px",

            borderRadius: "10px",

            background: "#fef2f2",

            color: "#b42318",

            fontSize: "13px",

            fontWeight: "700",

          }}
>

          โหลด Stock จาก Cloud ไม่สำเร็จ

          กรุณาลอง Refresh อีกครั้ง
</div>

      )}

      {salesCloudError && (
<div

          style={{

            marginBottom: "12px",

            padding: "10px 14px",

            borderRadius: "10px",

            background: "#fff3cd",

            color: "#664d03",

            fontSize: "13px",

          }}
>

          โหลดยอดขายจาก Cloud ไม่สำเร็จ

          ข้อมูลบน Dashboard อาจยังไม่อัปเดต กรุณาลองใหม่อีกครั้ง
  
</div>

      )}

      {lowStockProducts.length > 0 && (
<button

          type="button"

          className="db-stock-alert"

          onClick={goToStock}
>
<div className="db-stock-alert-icon">

            ⚠️
</div>
<div className="db-stock-alert-content">
<strong>

              สินค้าใกล้หมด{" "}

              {lowStockProducts.length}{" "}

              รายการ
</strong>
<span>

              {lowStockProducts

                .slice(0, 3)

                .map(

                  (product) =>

                    `${product.name} ${product.stock}/${product.minStock}`

                )

                .join(" • ")}

              {lowStockProducts.length > 3

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

            {selectedSales.length}{" "}

            บิล
</strong>
<small>

            เฉลี่ย{" "}

            {averageBill.toLocaleString(

              undefined,

              {

                maximumFractionDigits: 0,

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

            {summary.totalQty}{" "}

            ชิ้น
</strong>
<small>

            Margin{" "}

            {margin.toFixed(1)}

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

            {stockValue.toLocaleString(

              undefined,

              {

                maximumFractionDigits: 2,

              }

            )}{" "}

            บาท
</strong>
</div>
<div className="db-kpi">
<span>

            สินค้าขายดี
</span>
<strong>

            {topProducts[0]?.name || "-"}
</strong>
</div>
<div className="db-kpi">
<span>

            สินค้าใกล้หมด
</span>
<strong>

            {lowStockProducts.length}{" "}

            รายการ
</strong>
</div>
<div className="db-kpi">
<span>

            สินค้าทั้งหมด
</span>
<strong>

            {products.length}{" "}

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

          {topProducts.length === 0 ? (
<div className="db-empty">

              ยังไม่มีข้อมูลการขาย
</div>

          ) : (

            topProducts.map(

              (item, index) => (
<div

                  className="db-ranking"

                  key={`${item.name}-${item.option}`}
>
<div className="db-rank">

                    {index + 1}
</div>
<div className="db-product">
<strong>

                      {item.name}
</strong>
<span>

                      {item.option}
</span>
</div>
<div className="db-product-value">
<strong>

                      {item.quantity} ชิ้น
</strong>
<span>

                      {item.amount.toLocaleString()} บาท
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

          {stockCloudError ? (
<div className="db-empty">

              ไม่สามารถโหลด Stock

              ปัจจุบันจาก Cloud ได้
</div>

          ) : lowStockProducts.length === 0 ? (
<div className="db-empty">

              ไม่มีสินค้าใกล้หมด
</div>

          ) : (
<div

              className="db-low-stock-list"

              onClick={goToStock}

              role="button"

              tabIndex={0}
>

              {lowStockProducts.map(

                (product) => (
<div

                    className="db-low-stock-row"

                    key={product.id}
>
<span className="db-low-stock-name">

                      {product.name}
</span>
<strong

                      className={

                        product.stock <= 0

                          ? "db-low-stock-danger"

                          : "db-low-stock-warning"

                      }
>

                      {product.stock} ชิ้น
</strong>
</div>

                )

              )}
</div>

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

                key={item.hour}
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

                        item.amount > 0

                          ? Math.max(

                              3,

                              (

                                item.amount /

                                maxHourlyAmount

                              ) * 100

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
<div>
<h2>

                ยอดขาย 14 วัน
</h2>
<p>

                อาทิตย์ที่แล้ว เทียบอาทิตย์นี้
</p>
</div>
</div>
<div className="db-seven-chart">

            {last14Days.map(

              (day) => (
<div

                  className="db-day"

                  key={day.key}
>
<div className="db-day-area">
<div

                      className="db-day-bar"

                      style={{

                        height: `${

                          day.amount > 0

                            ? Math.max(

                                3,

                                (

                                  day.amount /

                                  max14DayAmount

                                ) * 100

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

                    {day.label}
<small

                      style={{

                        display: "block",

                        fontSize: "8px",

                        color: "#999",

                      }}
>

                      {day.week}
</small>
</span>
</div>

              )

            )}
</div>
</section>
<section className="db-box">
<div className="db-box-title">
<div>
<h2>

                กำไร 14 วัน
</h2>
<p>

                อาทิตย์ที่แล้ว เทียบอาทิตย์นี้
</p>
</div>
</div>
<div className="db-seven-chart">

            {last14Days.map(

              (day) => (
<div

                  className="db-day"

                  key={day.key}
>
<div className="db-day-area">
<div

                      className="db-day-bar profit"

                      style={{

                        height: `${

                          day.profit > 0

                            ? Math.max(

                                3,

                                (

                                  day.profit /

                                  max14DayProfit

                                ) * 100

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

                    {day.label}
<small

                      style={{

                        display: "block",

                        fontSize: "8px",

                        color: "#999",

                      }}
>

                      {day.week}
</small>
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

export default DashboardPage;
