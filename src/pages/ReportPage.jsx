import { useEffect, useMemo, useState } from "react";

import { 

  getCloudSalesRange,

  getCloudTodayBills

} from "../services/salesService";
 

import "./ReportPage.css";

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

  result.setDate(result.getDate() - (day === 0 ? 6 : day - 1));

  return result;

}

function numberText(value) {

  return Number(value || 0).toLocaleString("th-TH", { maximumFractionDigits: 0 });

}

function ReportPage() {

  const [sales, setSales] = useState([]);

  const [billsales, setBillSales] = useState([]);

  const [loading, setLoading] = useState(true);

  const [cloudError, setCloudError] = useState(false);

  const today = new Date();

  const firstDay = new Date();

  firstDay.setDate(firstDay.getDate() - 6);

  const todayKey = dateKey(new Date());

  const [startDate, setStartDate] = useState(todayKey);

  const [endDate, setEndDate] = useState(todayKey);

useEffect(() => {

  let active = true;

  async function loadSalesRange() {

    setLoading(

      true

    );

    try {

      const cloudSales =

        await getCloudSalesRange(

          startDate,

          endDate

        );

      if (!active) {

        return;

      }

      setSales(

        Array.isArray(

          cloudSales

        )

          ? cloudSales

          : []

      );

      const today =

  dateKey(new Date());


const todayBills =

  await getCloudTodayBills(

    startDate,

    endDate

  );


setBillSales(

  Array.isArray(todayBills)

    ? todayBills

    : []

);

      setCloudError(

        false

      );

    } catch (error) {

      console.error(

        "Report Cloud error:",

        error

      );

      if (!active) {

        return;

      }

      /*

        Cloud เป็นแหล่งข้อมูลหลัก

        ไม่ดึงประวัติ Sales เก่า

        จาก localStorage อีก

      */

      setSales([]);

      setCloudError(

        true

      );

    } finally {

      if (active) {

        setLoading(

          false

        );

      }

    }

  }

  loadSalesRange();

  return () => {

    active = false;

  };

}, [

  startDate,

  endDate,

]);
  
  const filteredSales = useMemo(() => {

    return sales.filter((sale) => {

      const soldDate = String(sale.soldDate || "").slice(0, 10);

      return soldDate && soldDate >= startDate && soldDate <= endDate;

    }).sort((a, b) => String(b.soldAt || "").localeCompare(String(a.soldAt || "")));

  }, [sales, startDate, endDate]);

  const summary = useMemo(() => {

    return filteredSales.reduce((result, sale) => {

      result.amount += Number(sale.totalAmount || 0);

      result.cost += Number(sale.totalCost || 0);

      result.profit += Number(sale.totalProfit || 0);

      result.qty += Number(sale.totalQty || 0);

      return result;

    }, { amount: 0, cost: 0, profit: 0, qty: 0 });

  }, [filteredSales]);

  const topProducts = useMemo(() => {

    const result = {};

    filteredSales.forEach((sale) => {

      sale.items?.forEach((item) => {

        const key = `${item.productId}-${item.option || ""}`;

        if (!result[key]) {

          result[key] = { name: item.productName || "-", option: item.option || "", quantity: 0, amount: 0, profit: 0 };

        }

        result[key].quantity += Number(item.quantity || 0);

        result[key].amount += Number(item.lineTotal || 0);

        result[key].profit += Number(item.lineProfit || 0);

      });

    });

    return Object.values(result).sort((a, b) => b.quantity - a.quantity).slice(0, 10);

  }, [filteredSales]);

  const averageBill = filteredSales.length ? summary.amount / filteredSales.length : 0;

  const chartData = useMemo(() => {

    const start = new Date(`${startDate}T00:00:00`);

    const end = new Date(`${endDate}T00:00:00`);

    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return [];

    const result = [];

    const cursor = new Date(start);

    while (cursor <= end) {

      const key = dateKey(cursor);

      const daySales = sales.filter((sale) => String(sale.soldDate || "").slice(0, 10) === key);

      result.push({

        key,

        label: cursor.toLocaleDateString("th-TH", { weekday: "short" }),

        dateLabel: cursor.toLocaleDateString("th-TH", { day: "numeric", month: "short" }),

        amount: daySales.reduce((sum, sale) => sum + Number(sale.totalAmount || 0), 0),

        profit: daySales.reduce((sum, sale) => sum + Number(sale.totalProfit || 0), 0),

      });

      cursor.setDate(cursor.getDate() + 1);

    }

    return result;

  }, [sales, startDate, endDate]);

  const chartMax = Math.max(1, ...chartData.map((item) => Math.max(item.amount, item.profit)));

  const chartTicks = [chartMax, chartMax * 0.75, chartMax * 0.5, chartMax * 0.25, 0];

  const chartWidth = Math.max(440, chartData.length * 72);

  const chartHeight = 280;

  const topPad = 18;

  const bottomPad = 24;

  const usableHeight = chartHeight - topPad - bottomPad;

  function xFor(index) {

    if (chartData.length <= 1) return chartWidth / 2;

    return 16 + (index / (chartData.length - 1)) * (chartWidth - 32);

  }

  function yFor(value) {

    return topPad + usableHeight - (Number(value || 0) / chartMax) * usableHeight;

  }

  const salesPath = chartData.map((item, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(item.amount)}`).join(" ");

  const profitPath = chartData.map((item, index) => `${index === 0 ? "M" : "L"} ${xFor(index)} ${yFor(item.profit)}`).join(" ");

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

    setStartDate(dateKey(new Date(now.getFullYear(), now.getMonth(), 1)));

    setEndDate(dateKey(now));

  }

  return (
<div className="report-page">
<header className="report-header">
<h1>รายงานการขาย</h1>
<p>เลือกช่วงวันที่ที่ต้องการดู</p>
</header>

     {cloudError && (
<div className="report-cloud-warning">

    Cloud เชื่อมต่อไม่สำเร็จ กรุณาลองใหม่อีกครั้ง
</div>

)}
 
<section className="report-filter">
<div className="report-date-box">
<label>วันที่เริ่ม</label>
<input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
</div>
<div className="report-date-box">
<label>วันที่สิ้นสุด</label>
<input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
</div>
<div className="report-quick-buttons">
<button type="button" onClick={setToday}>

วันนี้
</button>
<button type="button" onClick={setYesterday}>

เมื่อวาน
</button>
<button type="button" onClick={setLast7Days}>

7 วัน
</button>
<button type="button" onClick={setThisMonth}>

เดือนนี้
</button>
</div>
 
<button type="button" onClick={setToday}>วันนี้</button>
<button type="button" onClick={setThisWeek}>อาทิตย์นี้</button>
<button type="button" onClick={setLast7Days}>7 วัน</button>
<button type="button" onClick={setThisMonth}>เดือนนี้</button>
</div> 
</div>
</section>

      {loading ? (
<div className="report-empty">กำลังโหลดข้อมูลจาก Cloud...</div>

      ) : (
<>
<section className="report-summary-grid">
<article className="report-summary-card"><span>ยอดขาย</span><strong>{summary.amount.toLocaleString()} บาท</strong></article>
<article className="report-summary-card"><span>ต้นทุน</span><strong>{summary.cost.toLocaleString()} บาท</strong></article>
<article className="report-summary-card"><span>กำไร</span><strong>{summary.profit.toLocaleString()} บาท</strong></article>
<article className="report-summary-card"><span>จำนวนบิล</span><strong>{filteredSales.length} บิล</strong></article>
<article className="report-summary-card"><span>จำนวนสินค้า</span><strong>{summary.qty} ชิ้น</strong></article>
<article className="report-summary-card"><span>เฉลี่ยต่อบิล</span><strong>{numberText(averageBill)} บาท</strong></article>
</section>
<section className="report-box report-chart-box">
<div className="report-chart-title">
<div>
<h2>ยอดขายและกำไรรายวัน</h2>
<p>{startDate} ถึง {endDate}</p>
</div>
<div className="report-chart-legend">
<span><i className="sales-dot" />ยอดขาย</span>
<span><i className="profit-dot" />กำไร</span>
</div>
</div>

            {chartData.length === 0 ? (
<div className="report-empty">ไม่มีข้อมูลกราฟ</div>

            ) : (
<div className="report-chart-shell">
<div className="report-chart-y">

                  {chartTicks.map((value, index) => <span key={index}>{numberText(value)}</span>)}
</div>
<div className="report-chart-scroll">
<div className="report-chart-canvas" style={{ minWidth: chartData.length <= 7 ? "100%" : `${chartWidth}px` }}>
<svg className="report-chart-svg" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">

                      {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {

                        const y = topPad + usableHeight * ratio;

                        return <line key={ratio} className="report-grid-line" x1="0" x2={chartWidth} y1={y} y2={y} />;

                      })}
<path className="report-sales-line" d={salesPath} fill="none" vectorEffect="non-scaling-stroke" />
<path className="report-profit-line" d={profitPath} fill="none" vectorEffect="non-scaling-stroke" />

                      {chartData.map((item, index) => (
<g key={item.key}>
<circle className="report-sales-point" cx={xFor(index)} cy={yFor(item.amount)} r="5" vectorEffect="non-scaling-stroke" />
<circle className="report-profit-point" cx={xFor(index)} cy={yFor(item.profit)} r="5" vectorEffect="non-scaling-stroke" />
</g>

                      ))}
</svg>
<div className="report-chart-labels" style={{ gridTemplateColumns: `repeat(${chartData.length}, minmax(0, 1fr))` }}>

                      {chartData.map((item) => (
<div className="report-chart-label" key={item.key}>
<strong>{item.label}</strong>
<span>{item.dateLabel}</span>
<small>{numberText(item.amount)}</small>
</div>

                      ))}
</div>
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
<thead><tr><th>อันดับ</th><th>สินค้า</th><th>จำนวน</th><th>ยอดขาย</th><th>กำไร</th></tr></thead>
<tbody>

                      {topProducts.map((item, index) => (
<tr key={`${item.name}-${item.option}`}>
<td>{index + 1}</td>
<td><strong>{item.name}</strong><small>{item.option}</small></td>
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

              {billSales.length === 0 ? (
<div className="report-empty">ไม่มีบิลในช่วงวันที่นี้</div>

              ) : (
<div className="report-table-wrap">
<table className="report-table">
<thead><tr><th>เลขบิล</th><th>วันที่</th><th>เวลา</th><th>สินค้า</th><th>ยอดขาย</th><th>กำไร</th></tr></thead>
<tbody>

                      {billSales.map((sale) => (
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
 
