import {

  useEffect,

  useMemo,

  useState,

} from "react";

import {

  getCloudSales,

} from "../services/salesService";

import "./ReportPage.css";

const SALES_KEY =

  "dadboy_sales_v1";

function readSales() {

  try {

    const saved =

      localStorage.getItem(

        SALES_KEY

      );

    return saved

      ? JSON.parse(saved)

      : [];

  } catch {

    return [];

  }

}

function dateKey(

  date

) {

  return date.toLocaleDateString(

    "en-CA"

  );

}

function ReportPage() {

  const [

    sales,

    setSales,

  ] = useState([]);

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    cloudError,

    setCloudError,

  ] = useState(false);

  const today =

    new Date();

  const firstDay =

    new Date();

  firstDay.setDate(

    firstDay.getDate() -

      6

  );

  const [

    startDate,

    setStartDate,

  ] = useState(

    dateKey(

      firstDay

    )

  );

  const [

    endDate,

    setEndDate,

  ] = useState(

    dateKey(

      today

    )

  );

  async function loadSales() {

    setLoading(

      true

    );

    try {

      const cloudSales =

        await getCloudSales();

      /*

        ใช้ Cloud อย่างเดียว

        เมื่อโหลดสำเร็จ

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

        "Report: ใช้ยอดขายจาก Supabase",

        cloudSales.length

      );

    } catch (error) {

      console.error(

        "Report Cloud error:",

        error

      );

      /*

        fallback เฉพาะตอน Cloud ใช้ไม่ได้

      */

      const localSales =

        readSales();

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

    loadSales();

    function handleFocus() {

      loadSales();

    }

    window.addEventListener(

      "focus",

      handleFocus

    );

    return () => {

      window.removeEventListener(

        "focus",

        handleFocus

      );

    };

  }, []);

  const filteredSales =

    useMemo(() => {

      return sales

        .filter(

          (sale) => {

            if (

              !sale.soldDate

            ) {

              return false;

            }

            return (

              sale.soldDate >=

                startDate &&

              sale.soldDate <=

                endDate

            );

          }

        )

        .sort(

          (

            a,

            b

          ) =>

            String(

              b.soldAt ||

                ""

            ).localeCompare(

              String(

                a.soldAt ||

                  ""

              )

            )

        );

    }, [

      sales,

      startDate,

      endDate,

    ]);

  const summary =

    useMemo(() => {

      return filteredSales.reduce(

        (

          result,

          sale

        ) => {

          result.amount +=

            Number(

              sale.totalAmount ||

                0

            );

          result.cost +=

            Number(

              sale.totalCost ||

                0

            );

          result.profit +=

            Number(

              sale.totalProfit ||

                0

            );

          result.qty +=

            Number(

              sale.totalQty ||

                0

            );

          return result;

        },

        {

          amount:

            0,

          cost:

            0,

          profit:

            0,

          qty:

            0,

        }

      );

    }, [

      filteredSales,

    ]);

  const topProducts =

    useMemo(() => {

      const result =

        {};

      filteredSales.forEach(

        (sale) => {

          sale.items?.forEach(

            (item) => {

              const key =

                `${item.productId}-${item.option}`;

              if (

                !result[

                  key

                ]

              ) {

                result[

                  key

                ] = {

                  name:

                    item.productName,

                  option:

                    item.option,

                  quantity:

                    0,

                  amount:

                    0,

                  profit:

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

              result[

                key

              ].profit +=

                Number(

                  item.lineProfit ||

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

          10

        );

    }, [

      filteredSales,

    ]);

  const averageBill =

    filteredSales.length >

    0

      ? summary.amount /

        filteredSales.length

      : 0;

  function setToday() {

    const value =

      dateKey(

        new Date()

      );

    setStartDate(

      value

    );

    setEndDate(

      value

    );

  }

  function setLast7Days() {

    const end =

      new Date();

    const start =

      new Date();

    start.setDate(

      start.getDate() -

        6

    );

    setStartDate(

      dateKey(

        start

      )

    );

    setEndDate(

      dateKey(

        end

      )

    );

  }

  function setThisMonth() {

    const now =

      new Date();

    const start =

      new Date(

        now.getFullYear(),

        now.getMonth(),

        1

      );

    setStartDate(

      dateKey(

        start

      )

    );

    setEndDate(

      dateKey(

        now

      )

    );

  }

  return (
<div className="report-page">
<header className="report-header">
<div>
<h1>

            รายงานการขาย
</h1>
<p>

            เลือกช่วงวันที่ที่ต้องการดู
</p>
</div>
</header>

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

          รายงานกำลังใช้ข้อมูลสำรองจากเครื่อง
</div>

      )}
<section className="report-filter">
<div className="report-date-box">
<label>

            วันที่เริ่ม
</label>
<input

            type="date"

            value={

              startDate

            }

            onChange={(

              event

            ) =>

              setStartDate(

                event.target

                  .value

              )

            }

          />
</div>
<div className="report-date-box">
<label>

            วันที่สิ้นสุด
</label>
<input

            type="date"

            value={

              endDate

            }

            onChange={(

              event

            ) =>

              setEndDate(

                event.target

                  .value

              )

            }

          />
</div>
<div className="report-quick-buttons">
<button

            type="button"

            onClick={

              setToday

            }
>

            วันนี้
</button>
<button

            type="button"

            onClick={

              setLast7Days

            }
>

            7 วัน
</button>
<button

            type="button"

            onClick={

              setThisMonth

            }
>

            เดือนนี้
</button>
</div>
</section>

      {loading ? (
<div className="report-empty">

          กำลังโหลดข้อมูลจาก Cloud...
</div>

      ) : (
<>
<section className="report-summary-grid">
<article className="report-summary-card">
<span>

                ยอดขาย
</span>
<strong>

                {summary.amount.toLocaleString()}{" "}

                บาท
</strong>
</article>
<article className="report-summary-card">
<span>

                ต้นทุน
</span>
<strong>

                {summary.cost.toLocaleString()}{" "}

                บาท
</strong>
</article>
<article className="report-summary-card">
<span>

                กำไร
</span>
<strong>

                {summary.profit.toLocaleString()}{" "}

                บาท
</strong>
</article>
<article className="report-summary-card">
<span>

                จำนวนบิล
</span>
<strong>

                {

                  filteredSales.length

                }{" "}

                บิล
</strong>
</article>
<article className="report-summary-card">
<span>

                จำนวนสินค้า
</span>
<strong>

                {

                  summary.qty

                }{" "}

                ชิ้น
</strong>
</article>
<article className="report-summary-card">
<span>

                เฉลี่ยต่อบิล
</span>
<strong>

                {averageBill.toLocaleString(

                  undefined,

                  {

                    maximumFractionDigits:

                      0,

                  }

                )}{" "}

                บาท
</strong>
</article>
</section>
<div className="report-layout">
<section className="report-box">
<h2>

                สินค้าขายดี
</h2>

              {topProducts.length ===

              0 ? (
<div className="report-empty">

                  ไม่มีข้อมูล
</div>

              ) : (
<div className="report-table-wrap">
<table className="report-table">
<thead>
<tr>
<th>

                          อันดับ
</th>
<th>

                          สินค้า
</th>
<th>

                          จำนวน
</th>
<th>

                          ยอดขาย
</th>
<th>

                          กำไร
</th>
</tr>
</thead>
<tbody>

                      {topProducts.map(

                        (

                          item,

                          index

                        ) => (
<tr

                            key={`${item.name}-${item.option}`}
>
<td>

                              {index +

                                1}
</td>
<td>
<strong>

                                {

                                  item.name

                                }
</strong>
<small>

                                {

                                  item.option

                                }
</small>
</td>
<td>

                              {

                                item.quantity

                              }
</td>
<td>

                              {item.amount.toLocaleString()}
</td>
<td>

                              {item.profit.toLocaleString()}
</td>
</tr>

                        )

                      )}
</tbody>
</table>
</div>

              )}
</section>
<section className="report-box">
<h2>

                บิลขาย
</h2>

              {filteredSales.length ===

              0 ? (
<div className="report-empty">

                  ไม่มีบิลในช่วงวันที่นี้
</div>

              ) : (
<div className="report-table-wrap">
<table className="report-table">
<thead>
<tr>
<th>

                          เลขบิล
</th>
<th>

                          วันที่
</th>
<th>

                          เวลา
</th>
<th>

                          สินค้า
</th>
<th>

                          ยอดขาย
</th>
<th>

                          กำไร
</th>
</tr>
</thead>
<tbody>

                      {filteredSales.map(

                        (

                          sale

                        ) => (
<tr

                            key={

                              sale.billId

                            }
>
<td>

                              {

                                sale.billId

                              }
</td>
<td>

                              {

                                sale.soldDate

                              }
</td>
<td>

                              {

                                sale.soldTime

                              }
</td>
<td>

                              {

                                sale.totalQty

                              }
</td>
<td>

                              {Number(

                                sale.totalAmount ||

                                  0

                              ).toLocaleString()}
</td>
<td>

                              {Number(

                                sale.totalProfit ||

                                  0

                              ).toLocaleString()}
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
</>

      )}
</div>

  );

}

export default ReportPage;
 