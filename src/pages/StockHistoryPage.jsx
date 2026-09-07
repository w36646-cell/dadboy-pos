import {

  useEffect,

  useState,

} from "react";

import {

  getStockHistory,

} from "../services/stockHistoryService";


function formatDateTime(value) {

  if (!value) {

    return "-";

  }

  const date = new Date(value);

  if (

    Number.isNaN(

      date.getTime()

    )

  ) {

    return "-";

  }

  return new Intl.DateTimeFormat(

    "th-TH",

    {

      dateStyle: "short",

      timeStyle: "short",

    }

  ).format(date);

}


function differenceText(value) {

  const number =

    Number(value || 0);

  if (number > 0) {

    return `เพิ่ม +${number}`;

  }

  if (number < 0) {

    return `ลด ${number}`;

  }

  return "ไม่เปลี่ยน";

}


function StockHistoryPage() {

  const [

    receives,

    setReceives,

  ] = useState([]);

  const [

    adjustments,

    setAdjustments,

  ] = useState([]);

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    errorMessage,

    setErrorMessage,

  ] = useState("");


  async function loadHistory() {

    setLoading(true);

    setErrorMessage("");

    try {

      const result =

        await getStockHistory(10);

      setReceives(

        Array.isArray(

          result.receives

        )

          ? result.receives

          : []

      );

      setAdjustments(

        Array.isArray(

          result.adjustments

        )

          ? result.adjustments

          : []

      );

    } catch (error) {

      console.error(

        "Load stock history error:",

        error

      );

      setErrorMessage(

        "โหลดประวัติสต๊อกไม่สำเร็จ กรุณาตรวจสอบอินเทอร์เน็ตแล้วลองใหม่"

      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    loadHistory();

  }, []);


  const pageStyle = {

    minHeight: "100vh",

    padding: "24px",

    background: "#f5f6f8",

  };

  const headerStyle = {

    display: "flex",

    alignItems: "center",

    justifyContent:

      "space-between",

    gap: "12px",

    flexWrap: "wrap",

    marginBottom: "20px",

  };

  const cardStyle = {

    background: "#ffffff",

    border:

      "1px solid #e5e7eb",

    borderRadius: "14px",

    padding: "18px",

    marginBottom: "20px",

  };

  const tableWrapStyle = {

    width: "100%",

    overflowX: "auto",

  };

  const tableStyle = {

    width: "100%",

    minWidth: "720px",

    borderCollapse: "collapse",

  };

  const thStyle = {

    padding: "11px 10px",

    textAlign: "left",

    borderBottom:

      "2px solid #e5e7eb",

    whiteSpace: "nowrap",

  };

  const tdStyle = {

    padding: "11px 10px",

    borderBottom:

      "1px solid #eeeeee",

    verticalAlign: "top",

  };


  return (
<div style={pageStyle}>
<div style={headerStyle}>
<div>
<h1

            style={{

              margin: 0,

              fontSize: "28px",

            }}
>

            📋 ประวัติสต๊อก
</h1>
<p

            style={{

              margin:

                "6px 0 0",

              color: "#667085",

            }}
>

            แสดงอย่างละ 10 รายการล่าสุด
</p>
</div>
<button

          type="button"

          onClick={loadHistory}

          disabled={loading}

          style={{

            minHeight: "42px",

            padding:

              "0 16px",

            border:

              "1px solid #d0d5dd",

            borderRadius: "9px",

            background:

              "#ffffff",

            fontWeight: 700,

            cursor:

              loading

                ? "default"

                : "pointer",

          }}
>

          {loading

            ? "กำลังโหลด..."

            : "↻ รีเฟรช"}
</button>
</div>


      {errorMessage && (
<div

          style={{

            padding: "14px",

            marginBottom: "18px",

            border:

              "1px solid #f1c0c0",

            borderRadius: "10px",

            background:

              "#fff7f7",

          }}
>
<strong>

            ! {errorMessage}
</strong>
</div>

      )}

<section style={cardStyle}>
<h2

          style={{

            margin:

              "0 0 14px",

          }}
>

          📥 รับสินค้าเข้า
</h2>

        {loading ? (
<p>

            กำลังโหลดข้อมูล...
</p>

        ) : receives.length === 0 ? (
<p>

            — ยังไม่มีประวัติรับสินค้าเข้า
</p>

        ) : (
<div style={tableWrapStyle}>
<table style={tableStyle}>
<thead>
<tr>
<th style={thStyle}>

                    วัน / เวลา
</th>
<th style={thStyle}>

                    สินค้า
</th>
<th style={thStyle}>

                    รับเข้า
</th>
<th style={thStyle}>

                    ก่อนรับ
</th>
<th style={thStyle}>

                    หลังรับ
</th>
</tr>
</thead>
<tbody>

                {receives.map(

                  (item) => (
<tr

                      key={

                        item.operationId

                      }
>
<td style={tdStyle}>

                        {formatDateTime(

                          item.createdAt

                        )}
</td>
<td style={tdStyle}>
<strong>

                          {item.productName}
</strong>
</td>
<td style={tdStyle}>
<strong>

                          +{item.quantity}
</strong>

                        {" "}ชิ้น
</td>
<td style={tdStyle}>

                        {item.previousStock}

                        {" "}ชิ้น
</td>
<td style={tdStyle}>

                        {item.newStock}

                        {" "}ชิ้น
</td>
</tr>

                  )

                )}
</tbody>
</table>
</div>

        )}
</section>

<section style={cardStyle}>
<h2

          style={{

            margin:

              "0 0 14px",

          }}
>

          🧮 ปรับสต๊อก / กินเอง
</h2>

        {loading ? (
<p>

            กำลังโหลดข้อมูล...
</p>

        ) : adjustments.length === 0 ? (
<p>

            — ยังไม่มีประวัติปรับสต๊อก
</p>

        ) : (
<div style={tableWrapStyle}>
<table style={tableStyle}>
<thead>
<tr>
<th style={thStyle}>

                    วัน / เวลา
</th>
<th style={thStyle}>

                    สินค้า
</th>
<th style={thStyle}>

                    ก่อนปรับ
</th>
<th style={thStyle}>

                    หลังปรับ
</th>
<th style={thStyle}>

                    ผลต่าง
</th>
<th style={thStyle}>

                    เหตุผล
</th>
<th style={thStyle}>

                    หมายเหตุ
</th>
</tr>
</thead>
<tbody>

                {adjustments.map(

                  (item) => (
<tr

                      key={

                        item.adjustmentId

                      }
>
<td style={tdStyle}>

                        {formatDateTime(

                          item.adjustedAt

                        )}
</td>
<td style={tdStyle}>
<strong>

                          {item.productName}
</strong>
</td>
<td style={tdStyle}>

                        {item.previousStock}

                        {" "}ชิ้น
</td>
<td style={tdStyle}>

                        {item.actualStock}

                        {" "}ชิ้น
</td>
<td style={tdStyle}>

                        {differenceText(

                          item.difference

                        )}
</td>
<td style={tdStyle}>

                        {item.reason || "-"}
</td>
<td style={tdStyle}>

                        {item.note || "-"}
</td>
</tr>

                  )

                )}
</tbody>
</table>
</div>

        )}
</section>
</div>

  );

}


export default StockHistoryPage;

