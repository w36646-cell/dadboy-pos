import { useEffect, useMemo, useState } from "react";

import { getCloudSales } from "../services/salesService";

import "./ReportPage.css";

const SALES_KEY = "dadboy_sales_v1";

function readSales() {

  try {

    const saved = localStorage.getItem(SALES_KEY);

    return saved ? JSON.parse(saved) : [];

  } catch {

    return [];

  }

}

function dateKey(date) {

  const y = date.getFullYear();

  const m = String(date.getMonth() + 1).padStart(2, "0");

  const d = String(date.getDate()).padStart(2, "0");

  return `${y}-${m}-${d}`;

}

function startOfThisWeek(date = new Date()) {

  const result = new Date(date);

  result.setHours(0, 0, 0, 0);

  const day = result.getDay();

  const diff = day === 0 ? 6 : day - 1;

  result.setDate(result.getDate() - diff);

  return result;

}

function ReportPage() {

  const [sales, setSales] = useState([]);

  const [loading, setLoading] = useState(true);

  const [cloudError, setCloudError] = useState(false);

  const today = new Date();

  const firstDay = new Date();

  firstDay.setDate(firstDay.getDate() - 6);

  const [startDate, setStartDate] = useState(dateKey(firstDay));

  const [endDate, setEndDate] = useState(dateKey(today));

  async function loadSales() {

    setLoading(true);

    try {

      const cloudSales = await getCloudSales();

      setSales(Array.isArray(cloudSales) ? cloudSales : []);

      setCloudError(false);

    } catch (error) {

      console.error("Report Cloud error:", error);

      const localSales = readSales();

      setSales(Array.isArray(localSales) ? localSales : []);

      setCloudError(true);

    } finally {

      setLoading(false);

    }

  }

  useEffect(() => {

    loadSales();

    function handleFocus() {

      loadSales();

    }

    window.addEventListener("focus", handleFocus);

    return () => window.removeEventListener("focus", handleFocus);

  }, []);

  const filteredSales = useMemo(() => {

    return sales

      .filter((sale) => {

        const soldDate = String(sale.soldDate || "").slice(0, 10);

        return soldDate && soldDate >= startDate && soldDate <= endDate;

      })

      .sort((a, b) => String(b.soldAt || "").localeCompare(String(a.soldAt || "")));

  }, [sales, startDate, endDate]);

  const summary = useMemo(() => {

    return filteredSales.reduce(

      (result, sale) => {

        result.amount += Number(sale.totalAmount || 0);

        result.cost += Number(sale.totalCost || 0);

        result.profit += Number(sale.totalProfit || 0);

        result.qty += Number(sale.totalQty || 0);

        return result;

      },

      { amount: 0, cost: 0, profit: 0, qty: 0 }

    );

  }, [filteredSales]);

  const topProducts = useMemo(() => {

    const result = {};

    filteredSales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key = `${item.productId}-${item.option || ""}`;

        if (!result[key]) {

          result[key] = {

            name: item.productName || "-",

            option: item.option || "",

            quantity: 0,

            amount: 0,

            profit: 0,

          };

        }

        result[key].quantity += Number(item.quantity || 0);

        result[key].amount += Number(item.lineTotal || 0);

        result[key].profit += Number(item.lineProfit || 0);

      });

    });

    return Object.values(result).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  }, [filteredSales]);

  const averageBill = filteredSales.length > 0 ? summary.amount / filteredSales.length : 0;

  const chartData = useMemo(() => {

    const start = new Date(`${startDate}T00:00:00`);

    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

    const result = [];

    const cursor = new Date(start);

    while (cursor <= end) {

      const key = dateKey(cursor);

      const daySales = sales.filter((sale) => String(sale.soldDate || "").slice(0, 10) === key);

      const amount = daySales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0);

      const profit = daySales.reduce((sum, sale) => sum + Number(sale.totalProfit || 0), 0);

      result.push({

        key,

        label: cursor.toLocaleDateString("th-TH", { weekday: "short" }),

        dateLabel: cursor.toLocaleDateString("th-TH", { day: "numeric", month: "short" }),

        amount,

        profit,

      });

      cursor.setDate(cursor.getDate() + 1);

    }

    return result;

  }, [sales, startDate, endDate]);

  const maxChartAmount = Math.max(1, ...chartData.map((item) => item.amount));

  const maxChartProfit = Math.max(1, ...chartData.map((item) => item.profit));

  function setToday() {

    const value = dateKey(new Date());

    setStartDate(value);

    setEndDate(value);

  }

  function setThisWeek() {

    const now = new Date();

    setStartDate(dateKey(startOfThisWeek(now)));

    setEndDate(dateKey(now));

  }

  function setLast7Days() {

    const end = new Date();

    const start = new Date();

    start.setDate(start.getDate() - 6);

    setStartDate(dateKey(start));

    setEndDate(dateKey(end));

  }

  function setThisMonth() {

    const now = new Date();

    const start = new Date(now.getFullYear(), now.getMonth(), 1);

    setStartDate(dateKey(start));

    setEndDate(dateKey(now));

  }

  return (
<div className="report-page">
<header className="report-header">
<div>
<h1>รายงานการขาย</h1>
<p>เลือกช่วงวันที่ที่ต้องการดู</p>
</div>
</header>

      {cloudError && (
<div className="report-cloud-warning">

          Cloud เชื่อมต่อไม่สำเร็จ รายงานกำลังใช้ข้อมูลสำรองจากเครื่อง
</div>

      )}
<section className="report-filter">
<div className="report-date-box">
<label>วันที่เริ่ม</label>
<input type="date" value={startDate} onChange={(event) => setStartDate(event.target.value)} />
</div>
<div className="report-date-box">
<label>วันที่สิ้นสุด</label>
<input type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
</div>
<div className="report-quick-buttons">
<button type="button" onClick={setToday}>วันนี้</button>
<button type="button" onClick={setThisWeek}>อาทิตย์นี้</button>
<button type="button" onClick={setLast7Days}>7 วัน</button>
<button type="button" onClick={setThisMonth}>เดือนนี้</button>
</div>
</section>

      {loading ? (
<div className="report-empty">กำลังโหลดข้อมูลจาก Cloud...</div>

      ) : (
<>
<section className="report-summary-grid">
<article className="report-summary-card">
<span>ยอดขาย</span>
<strong>{summary.amount.toLocaleString()} บาท</strong>
</article>
<article className="report-summary-card">
<span>ต้นทุน</span>
<strong>{summary.cost.toLocaleString()} บาท</strong>
</article>
<article className="report-summary-card">
<span>กำไร</span>
<strong>{summary.profit.toLocaleString()} บาท</strong>
</article>
<article className="report-summary-card">
<span>จำนวนบิล</span>
<strong>{filteredSales.length} บิล</strong>
</article>
<article className="report-summary-card">
<span>จำนวนสินค้า</span>
<strong>{summary.qty} ชิ้น</strong>
</article>
<article className="report-summary-card">
<span>เฉลี่ยต่อบิล</span>
<strong>

                {averageBill.toLocaleString(undefined, { maximumFractionDigits: 0 })} บาท
</strong>
</article>
</section>
<section className="report-box report-chart-box">
<div className="report-chart-title">
<div>
<h2>กราฟยอดขาย</h2>
<p>

                  {startDate} ถึง {endDate}
</p>
</div>
<div className="report-chart-legend">
<span className="sales-dot" /> ยอดขาย
<span className="profit-dot" /> กำไร
</div>
</div>

            {chartData.length === 0 ? (
<div className="report-empty">ไม่มีข้อมูลกราฟ</div>

            ) : (
<div className="report-line-chart">
<div className="report-chart-y-lines">
<span>100%</span>
<span>75%</span>
<span>50%</span>
<span>25%</span>
<span>0%</span>
</div>
<div className="report-chart-area">
<svg

                    className="report-chart-svg"

                    viewBox={`0 0 ${Math.max(700, chartData.length * 90)} 300`}

                    preserveAspectRatio="none"
>
<polyline

                      className="report-sales-line"

                      fill="none"

                      points={chartData

                        .map((item, index) => {

                          const x =

                            chartData.length === 1

                              ? 350

                              : (index / (chartData.length - 1)) * Math.max(700, chartData.length * 90);

                          const y = 270 - (item.amount / maxChartAmount) * 240;

                          return `${x},${y}`;

                        })

                        .join(" ")}

                    />
<polyline

                      className="report-profit-line"

                      fill="none"

                      points={chartData

                        .map((item, index) => {

                          const x =

                            chartData.length === 1

                              ? 350

                              : (index / (chartData.length - 1)) * Math.max(700, chartData.length * 90);

                          const y = 270 - (item.profit / maxChartProfit) * 240;

                          return `${x},${y}`;

                        })

                        .join(" ")}

                    />

                    {chartData.map((item, index) => {

                      const width = Math.max(700, chartData.length * 90);

                      const x =

                        chartData.length === 1 ? width / 2 : (index / (chartData.length - 1)) * width;

                      const salesY = 270 - (item.amount / maxChartAmount) * 240;

                      const profitY = 270 - (item.profit / maxChartProfit) * 240;

                      return (
<g key={item.key}>
<circle className="report-sales-point" cx={x} cy={salesY} r="5" />
<circle className="report-profit-point" cx={x} cy={profitY} r="5" />
</g>

                      );

                    })}
</svg>
<div

                    className="report-chart-labels"

                    style={{

                      gridTemplateColumns: `repeat(${chartData.length}, minmax(70px, 1fr))`,

                      minWidth: `${Math.max(700, chartData.length * 90)}px`,

                    }}
>

                    {chartData.map((item) => (
<div className="report-chart-label" key={item.key}>
<strong>{item.label}</strong>
<span>{item.dateLabel}</span>
<small>{item.amount.toLocaleString()} บ.</small>
</div>

                    ))}
</div>
</div>
</div>

            )}
</section>
<div className="report-layout">
<section className="report-box">
<h2>สินค้าขายดี</h2>

              {topProducts.length === 0 ? (
<div className="report-empty">ไม่มีข้อมูล</div>

              ) : (
<div className="report-table-wrap">
<table className="report-table">
<thead>
<tr>
<th>อันดับ</th>
<th>สินค้า</th>
<th>จำนวน</th>
<th>ยอดขาย</th>
<th>กำไร</th>
</tr>
</thead>
<tbody>

                      {topProducts.map((item, index) => (
<tr key={`${item.name}-${item.option}`}>
<td>{index + 1}</td>
<td>
<strong>{item.name}</strong>
<small>{item.option}</small>
</td>
<td>{item.quantity}</td>
<td>{item.amount.toLocaleString()}</td>
<td>{item.profit.toLocaleString()}</td>
</tr>

                      ))}
</tbody>
</table>
</div>

              )}
</section>
<section className="report-box">
<h2>บิลขาย</h2>

              {filteredSales.length === 0 ? (
<div className="report-empty">ไม่มีบิลในช่วงวันที่นี้</div>

              ) : (
<div className="report-table-wrap">
<table className="report-table">
<thead>
<tr>
<th>เลขบิล</th>
<th>วันที่</th>
<th>เวลา</th>
<th>สินค้า</th>
<th>ยอดขาย</th>
<th>กำไร</th>
</tr>
</thead>
<tbody>

                      {filteredSales.map((sale) => (
<tr key={sale.billId}>
<td>{sale.billId}</td>
<td>{sale.soldDate}</td>
<td>{sale.soldTime}</td>
<td>{sale.totalQty}</td>
<td>{Number(sale.totalAmount || 0).toLocaleString()}</td>
<td>{Number(sale.totalProfit || 0).toLocaleString()}</td>
</tr>

                      ))}
</tbody>
</table>
</div>

              )}
</section>
</div>
</>

      )}
</div>

  );

}

export default ReportPage;
 
