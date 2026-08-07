import { useMemo } from "react";

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

function DashboardPage() {

  const sales = readStorage(SALES_KEY, []);

  const inventory = readStorage(STOCK_KEY, {});

  const products = readStorage(PRODUCTS_KEY, []);

  const today = new Date().toLocaleDateString("en-CA");

  const todaySales = useMemo(() => {

    return sales.filter(

      (sale) => sale.soldDate === today

    );

  }, [sales, today]);

  const summary = useMemo(() => {

    return todaySales.reduce(

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

  }, [todaySales]);

  const topProducts = useMemo(() => {

    const result = {};

    todaySales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key = `${item.productId}-${item.option}`;

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

        (a, b) => b.quantity - a.quantity

      )

      .slice(0, 5);

  }, [todaySales]);

  const lowStockProducts = useMemo(() => {

    return products

      .map((product) => ({

        ...product,

        stock: Number(

          inventory[product.id] ?? product.stock ?? 50

        ),

      }))

      .filter((product) => product.stock <= 5)

      .sort((a, b) => a.stock - b.stock)

      .slice(0, 10);

  }, [products, inventory]);

  const bestProduct =

    topProducts.length > 0

      ? topProducts[0]

      : null;

  return (
<div className="dashboard-page">
<div className="dashboard-header">
<div>
<h1>Dashboard</h1>
<p>สรุปยอดขายวันนี้</p>
</div>
</div>
<div className="dashboard-summary-grid">
<div className="dashboard-summary-card">
<span>ยอดขายวันนี้</span>
<strong>

            {summary.totalAmount.toLocaleString()} บาท
</strong>
</div>
<div className="dashboard-summary-card">
<span>กำไรวันนี้</span>
<strong>

            {summary.totalProfit.toLocaleString()} บาท
</strong>
</div>
<div className="dashboard-summary-card">
<span>จำนวนบิล</span>
<strong>

            {todaySales.length.toLocaleString()} บิล
</strong>
</div>
<div className="dashboard-summary-card">
<span>จำนวนสินค้าที่ขาย</span>
<strong>

            {summary.totalQty.toLocaleString()} ชิ้น
</strong>
</div>
</div>
<div className="dashboard-main-grid">
<section className="dashboard-box">
<div className="dashboard-box-title">
<div>
<h2>สินค้าขายดีวันนี้</h2>

              {bestProduct && (
<p>

                  อันดับ 1: {bestProduct.name}
</p>

              )}
</div>
</div>

          {topProducts.length === 0 ? (
<div className="dashboard-empty">

              ยังไม่มีข้อมูลการขายวันนี้
</div>

          ) : (
<div className="dashboard-ranking">

              {topProducts.map(

                (item, index) => (
<div

                    className="dashboard-ranking-row"

                    key={`${item.name}-${item.option}`}
>
<div className="dashboard-rank">

                      {index + 1}
</div>
<div className="dashboard-ranking-info">
<strong>{item.name}</strong>
<span>

                        {item.option}
</span>
</div>
<div className="dashboard-ranking-value">
<strong>

                        {item.quantity} ชิ้น
</strong>
<span>

                        {item.amount.toLocaleString()} บาท
</span>
</div>
</div>

                )

              )}
</div>

          )}
</section>
<section className="dashboard-box">
<div className="dashboard-box-title">
<div>
<h2>สินค้าใกล้หมด</h2>
<p>

                เหลือไม่เกิน 5 ชิ้น
</p>
</div>
<strong>

              {lowStockProducts.length} รายการ
</strong>
</div>

          {lowStockProducts.length === 0 ? (
<div className="dashboard-empty">

              ไม่มีสินค้าใกล้หมด
</div>

          ) : (
<div className="dashboard-low-stock-list">

              {lowStockProducts.map(

                (product) => (
<div

                    className="dashboard-low-stock-row"

                    key={product.id}
>
<div>
<strong>

                        {product.name}
</strong>
</div>
<span

                      className={

                        product.stock < 0

                          ? "dashboard-stock-number negative"

                          : "dashboard-stock-number"

                      }
>

                      {product.stock}
</span>
</div>

                )

              )}
</div>

          )}
</section>
</div>
</div>

  );

}

export default DashboardPage;