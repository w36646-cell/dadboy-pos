import { useMemo } from "react";

const SALES_KEY = "dadboy_sales_v1";

function loadSales() {

  try {

    return JSON.parse(

      localStorage.getItem(SALES_KEY) || "[]"

    );

  } catch {

    return [];

  }

}

function Dashboard({ onClose }) {

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

      (result, sale) => ({

        totalAmount:

          result.totalAmount +

          Number(sale.totalAmount || 0),

        totalCost:

          result.totalCost +

          Number(sale.totalCost || 0),

        totalProfit:

          result.totalProfit +

          Number(sale.totalProfit || 0),

        totalQty:

          result.totalQty +

          Number(sale.totalQty || 0),

      }),

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

    sales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key = `${item.productId}-${item.option}`;

        if (!result[key]) {

          result[key] = {

            name: item.productName,

            option: item.option,

            quantity: 0,

            amount: 0,

            profit: 0,

          };

        }

        result[key].quantity += Number(

          item.quantity || 0

        );

        result[key].amount += Number(

          item.lineTotal || 0

        );

        result[key].profit += Number(

          item.lineProfit || 0

        );

      });

    });

    return Object.values(result)

      .sort(

        (a, b) => b.quantity - a.quantity

      )

      .slice(0, 10);

  }, [sales]);

  return (
<div className="dashboard-page">
<div className="manager-header">
<div>
<h1>Dashboard</h1>
<p>สรุปยอดขายและกำไร</p>
</div>
<button

          className="stock-close-button"

          type="button"

          onClick={onClose}
>

          กลับหน้าขาย
</button>
</div>
<div className="dashboard-cards">
<div className="dashboard-card">
<span>ยอดขายวันนี้</span>
<strong>

            {summary.totalAmount} บาท
</strong>
</div>
<div className="dashboard-card">
<span>ต้นทุนวันนี้</span>
<strong>

            {summary.totalCost} บาท
</strong>
</div>
<div className="dashboard-card">
<span>กำไรวันนี้</span>
<strong>

            {summary.totalProfit} บาท
</strong>
</div>
<div className="dashboard-card">
<span>จำนวนบิลวันนี้</span>
<strong>

            {todaySales.length} บิล
</strong>
</div>
<div className="dashboard-card">
<span>จำนวนชิ้นวันนี้</span>
<strong>

            {summary.totalQty} ชิ้น
</strong>
</div>
</div>
<div className="dashboard-section">
<h2>สินค้าขายดี</h2>

        {topProducts.length === 0 ? (
<p>ยังไม่มีข้อมูลการขาย</p>

        ) : (
<table className="product-table">
<thead>
<tr>
<th>สินค้า</th>
<th>ตัวเลือก</th>
<th>จำนวน</th>
<th>ยอดขาย</th>
<th>กำไร</th>
</tr>
</thead>
<tbody>

              {topProducts.map(

                (item, index) => (
<tr

                    key={`${item.name}-${item.option}`}
>
<td>

                      {index + 1}. {item.name}
</td>
<td>{item.option}</td>
<td>

                      {item.quantity}
</td>
<td>

                      {item.amount} บาท
</td>
<td>

                      {item.profit} บาท
</td>
</tr>

                )

              )}
</tbody>
</table>

        )}
</div>
</div>

  );

}

export default Dashboard;
 