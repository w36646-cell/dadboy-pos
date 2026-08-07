import { useMemo } from "react";

const SALES_KEY = "dadboy_sales_v1";

function loadSales() {

  try {

    const saved = localStorage.getItem(SALES_KEY);

    return saved ? JSON.parse(saved) : [];

  } catch {

    return [];

  }

}

function DashboardPage() {

  const sales = loadSales();

  const today = new Date().toLocaleDateString("en-CA");

  const todaySales = useMemo(

    () =>

      sales.filter(

        (sale) => sale.soldDate === today

      ),

    [sales, today]

  );

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

  const averageBill =

    todaySales.length > 0

      ? summary.totalAmount / todaySales.length

      : 0;

  const topProducts = useMemo(() => {

    const productSummary = {};

    sales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key = `${item.productId}-${item.option}`;

        if (!productSummary[key]) {

          productSummary[key] = {

            name: item.productName,

            option: item.option,

            quantity: 0,

            amount: 0,

            profit: 0,

          };

        }

        productSummary[key].quantity += Number(

          item.quantity || 0

        );

        productSummary[key].amount += Number(

          item.lineTotal || 0

        );

        productSummary[key].profit += Number(

          item.lineProfit || 0

        );

      });

    });

    return Object.values(productSummary)

      .sort(

        (first, second) =>

          second.quantity - first.quantity

      )

      .slice(0, 10);

  }, [sales]);

  const recentBills = useMemo(() => {

    return [...sales]

      .sort(

        (first, second) =>

          new Date(second.soldAt) -

          new Date(first.soldAt)

      )

      .slice(0, 10);

  }, [sales]);

  return (
<div className="dashboard-page">
<header className="page-header">
<div>
<h1>Dashboard</h1>
<p>สรุปข้อมูลการขายของร้าน</p>
</div>
</header>
<div className="dashboard-cards">
<article className="dashboard-card">
<span>ยอดขายวันนี้</span>
<strong>

            {summary.totalAmount.toLocaleString()} บาท
</strong>
</article>
<article className="dashboard-card">
<span>ต้นทุนวันนี้</span>
<strong>

            {summary.totalCost.toLocaleString()} บาท
</strong>
</article>
<article className="dashboard-card">
<span>กำไรวันนี้</span>
<strong>

            {summary.totalProfit.toLocaleString()} บาท
</strong>
</article>
<article className="dashboard-card">
<span>จำนวนบิลวันนี้</span>
<strong>

            {todaySales.length.toLocaleString()} บิล
</strong>
</article>
<article className="dashboard-card">
<span>จำนวนสินค้าที่ขาย</span>
<strong>

            {summary.totalQty.toLocaleString()} ชิ้น
</strong>
</article>
<article className="dashboard-card">
<span>ยอดเฉลี่ยต่อบิล</span>
<strong>

            {averageBill.toLocaleString(undefined, {

              maximumFractionDigits: 2,

            })}{" "}

            บาท
</strong>
</article>
</div>
<section className="dashboard-section">
<h2>สินค้าขายดี 10 อันดับ</h2>

        {topProducts.length === 0 ? (
<p className="empty-dashboard">

            ยังไม่มีข้อมูลการขาย
</p>

        ) : (
<div className="dashboard-table-wrap">
<table className="product-table">
<thead>
<tr>
<th>อันดับ</th>
<th>สินค้า</th>
<th>ตัวเลือก</th>
<th>จำนวน</th>
<th>ยอดขาย</th>
<th>กำไร</th>
</tr>
</thead>
<tbody>

                {topProducts.map((item, index) => (
<tr

                    key={`${item.name}-${item.option}`}
>
<td>{index + 1}</td>
<td>{item.name}</td>
<td>{item.option}</td>
<td>{item.quantity}</td>
<td>

                      {item.amount.toLocaleString()} บาท
</td>
<td>

                      {item.profit.toLocaleString()} บาท
</td>
</tr>

                ))}
</tbody>
</table>
</div>

        )}
</section>
<section className="dashboard-section">
<h2>บิลล่าสุด</h2>

        {recentBills.length === 0 ? (
<p className="empty-dashboard">

            ยังไม่มีบิลขาย
</p>

        ) : (
<div className="dashboard-table-wrap">
<table className="product-table">
<thead>
<tr>
<th>เลขที่บิล</th>
<th>วันที่</th>
<th>เวลา</th>
<th>จำนวนสินค้า</th>
<th>ยอดรวม</th>
<th>กำไร</th>
</tr>
</thead>
<tbody>

                {recentBills.map((sale) => (
<tr key={sale.billId}>
<td>{sale.billId}</td>
<td>{sale.soldDate}</td>
<td>{sale.soldTime}</td>
<td>{sale.totalQty}</td>
<td>

                      {Number(

                        sale.totalAmount || 0

                      ).toLocaleString()}{" "}

                      บาท
</td>
<td>

                      {Number(

                        sale.totalProfit || 0

                      ).toLocaleString()}{" "}

                      บาท
</td>
</tr>

                ))}
</tbody>
</table>
</div>

        )}
</section>
</div>

  );

}

export default DashboardPage;
 