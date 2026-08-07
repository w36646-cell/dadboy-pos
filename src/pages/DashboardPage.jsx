import {

  useEffect,

  useMemo,

  useState,

} from "react";

import "./DashboardPage.css";

const SALES_KEY = "dadboy_sales_v1";

const STOCK_KEY = "dadboy_inventory_v2";

const PRODUCTS_KEY = "dadboy_products_v1";

function readStorage(key, fallback) {

  try {

    const saved = localStorage.getItem(key);

    return saved ? JSON.parse(saved) : fallback;

  } catch {

    return fallback;

  }

}

function formatDateKey(date) {

  return date.toLocaleDateString("en-CA");

}

function summarize(saleList) {

  return saleList.reduce(

    (result, sale) => {

      result.totalAmount += Number(

        sale.totalAmount || 0

      );

      result.totalCost += Number(

        sale.totalCost || 0

      );

      result.totalProfit += Number(

        sale.totalProfit || 0

      );

      result.totalQty += Number(

        sale.totalQty || 0

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

function DashboardPage() {

  const [sales, setSales] = useState(() =>

    readStorage(SALES_KEY, [])

  );

  const [inventory, setInventory] =

    useState(() =>

      readStorage(STOCK_KEY, {})

    );

  const [products, setProducts] =

    useState(() =>

      readStorage(PRODUCTS_KEY, [])

    );

  function reloadDashboardData() {

    setSales(

      readStorage(SALES_KEY, [])

    );

    setInventory(

      readStorage(STOCK_KEY, {})

    );

    setProducts(

      readStorage(PRODUCTS_KEY, [])

    );

  }

  useEffect(() => {

    const timer = setInterval(() => {

      reloadDashboardData();

    }, 2000);

    window.addEventListener(

      "focus",

      reloadDashboardData

    );

    window.addEventListener(

      "storage",

      reloadDashboardData

    );

    return () => {

      clearInterval(timer);

      window.removeEventListener(

        "focus",

        reloadDashboardData

      );

      window.removeEventListener(

        "storage",

        reloadDashboardData

      );

    };

  }, []);

  const now = new Date();

  const today = formatDateKey(now);

  const todaySales = useMemo(() => {

    return sales.filter(

      (sale) => sale.soldDate === today

    );

  }, [sales, today]);

  const summary = useMemo(() => {

    return summarize(todaySales);

  }, [todaySales]);

  const averageBill =

    todaySales.length > 0

      ? summary.totalAmount /

        todaySales.length

      : 0;

  const margin =

    summary.totalAmount > 0

      ? (

          summary.totalProfit /

          summary.totalAmount

        ) * 100

      : 0;

  const topProducts = useMemo(() => {

    const result = {};

    todaySales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key =

          `${item.productId}-${item.option}`;

        if (!result[key]) {

          result[key] = {

            name: item.productName,

            option: item.option,

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

      .sort(

        (a, b) =>

          b.quantity - a.quantity

      )

      .slice(0, 5);

  }, [todaySales]);

  const lowStockProducts = useMemo(() => {

    return products

      .map((product) => ({

        ...product,

        stock: Number(

          inventory[product.id] ??

            product.stock ??

            50

        ),

      }))

      .filter(

        (product) =>

          product.stock <= 5

      )

      .sort(

        (a, b) =>

          a.stock - b.stock

      )

      .slice(0, 10);

  }, [products, inventory]);

  const stockValue = useMemo(() => {

    return products.reduce(

      (total, product) => {

        const stock = Number(

          inventory[product.id] ??

            product.stock ??

            0

        );

        const cost = Number(

          product.cost || 0

        );

        return (

          total +

          Math.max(stock, 0) *

            cost

        );

      },

      0

    );

  }, [products, inventory]);

  const hourlySales = useMemo(() => {

    const hours = Array.from(

      { length: 16 },

      (_, index) => ({

        hour: index + 7,

        amount: 0,

      })

    );

    todaySales.forEach((sale) => {

      const saleDate = new Date(

        sale.soldAt

      );

      if (

        Number.isNaN(

          saleDate.getTime()

        )

      ) {

        return;

      }

      const hour =

        saleDate.getHours();

      const target =

        hours.find(

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

  }, [todaySales]);

  const maxHourlyAmount = Math.max(

    1,

    ...hourlySales.map(

      (item) => item.amount

    )

  );

  const last7Days = useMemo(() => {

    const result = [];

    for (

      let index = 6;

      index >= 0;

      index -= 1

    ) {

      const date = new Date();

      date.setHours(0, 0, 0, 0);

      date.setDate(

        date.getDate() - index

      );

      const key =

        formatDateKey(date);

      const daySales =

        sales.filter(

          (sale) =>

            sale.soldDate === key

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

        amount:

          daySummary.totalAmount,

        profit:

          daySummary.totalProfit,

      });

    }

    return result;

  }, [sales]);

  const max7DayAmount = Math.max(

    1,

    ...last7Days.map(

      (day) => day.amount

    )

  );

  const max7DayProfit = Math.max(

    1,

    ...last7Days.map(

      (day) => day.profit

    )

  );

  return (
<div className="db-page">
<div className="db-header">
<div>
<h1>Dashboard</h1>
<p>

            ภาพรวมร้านวันนี้
</p>
</div>
<div className="db-live">
<span />

          LIVE
</div>
</div>
<div className="db-summary-grid">
<div className="db-card">
<span>ยอดขายวันนี้</span>
<strong>

            {summary.totalAmount.toLocaleString()} บาท
</strong>
</div>
<div className="db-card">
<span>กำไรวันนี้</span>
<strong>

            {summary.totalProfit.toLocaleString()} บาท
</strong>
</div>
<div className="db-card">
<span>จำนวนบิล</span>
<strong>

            {todaySales.length} บิล
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
<span>ขายได้ทั้งหมด</span>
<strong>

            {summary.totalQty} ชิ้น
</strong>
<small>

            Margin{" "}

            {margin.toFixed(1)}%
</small>
</div>
</div>
<div className="db-kpi-grid">
<div className="db-kpi">
<span>มูลค่าสต๊อก</span>
<strong>

            {stockValue.toLocaleString()} บาท
</strong>
</div>
<div className="db-kpi">
<span>สินค้าขายดี</span>
<strong>

            {topProducts[0]?.name || "-"}
</strong>
</div>
<div className="db-kpi">
<span>สินค้าใกล้หมด</span>
<strong>

            {lowStockProducts.length} รายการ
</strong>
</div>
<div className="db-kpi">
<span>สินค้าทั้งหมด</span>
<strong>

            {products.length} รายการ
</strong>
</div>
</div>
<div className="db-main-grid">
<section className="db-box">
<div className="db-box-title">
<h2>

              สินค้าขายดีวันนี้
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

              สินค้าใกล้หมด
</h2>
</div>

          {lowStockProducts.length === 0 ? (
<div className="db-empty">

              ไม่มีสินค้าใกล้หมด
</div>

          ) : (

            lowStockProducts.map(

              (product) => (
<div

                  className="db-low-stock"

                  key={product.id}
>
<strong>

                    {product.name}
</strong>
<span

                    className={

                      product.stock < 0

                        ? "negative"

                        : ""

                    }
>

                    {product.stock}
</span>
</div>

              )

            )

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

          {hourlySales.map((item) => (
<div

              className="db-hour-row"

              key={item.hour}
>
<span>

                {String(

                  item.hour

                ).padStart(2, "0")}

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

          ))}
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

            {last7Days.map((day) => (
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

                  {day.label}
</span>
</div>

            ))}
</div>
</section>
<section className="db-box">
<div className="db-box-title">
<h2>

              กำไร 7 วัน
</h2>
</div>
<div className="db-seven-chart">

            {last7Days.map((day) => (
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

                  {day.label}
</span>
</div>

            ))}
</div>
</section>
</div>
</div>

  );

}

export default DashboardPage;