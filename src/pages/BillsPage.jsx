import { useMemo, useState } from "react";

import "./BillsPage.css";

const SALES_KEY = "dadboy_sales_v1";

const STOCK_KEY = "dadboy_inventory_v2";

function readStorage(key, fallback) {

  try {

    const saved = localStorage.getItem(key);

    return saved ? JSON.parse(saved) : fallback;

  } catch {

    return fallback;

  }

}

function BillsPage() {

  const [sales, setSales] = useState(() =>

    readStorage(SALES_KEY, [])

  );

  const [selectedBill, setSelectedBill] =

    useState(null);

  const [searchText, setSearchText] =

    useState("");

  const filteredSales = useMemo(() => {

    const keyword = searchText

      .trim()

      .toLowerCase();

    const result = [...sales].sort(

      (a, b) =>

        new Date(b.soldAt) -

        new Date(a.soldAt)

    );

    if (!keyword) {

      return result;

    }

    return result.filter((sale) => {

      const billId = String(

        sale.billId || ""

      ).toLowerCase();

      const date = String(

        sale.soldDate || ""

      ).toLowerCase();

      const productNames =

        sale.items

          ?.map(

            (item) =>

              item.productName

          )

          .join(" ")

          .toLowerCase() || "";

      return (

        billId.includes(keyword) ||

        date.includes(keyword) ||

        productNames.includes(keyword)

      );

    });

  }, [sales, searchText]);

  function cancelBill(sale) {

    if (!sale) {

      return;

    }

    const confirmed =

      window.confirm(

        `ยกเลิกบิล ${sale.billId} ใช่หรือไม่?\nสต๊อกสินค้าจะถูกคืนกลับ`

      );

    if (!confirmed) {

      return;

    }

    const inventory = readStorage(

      STOCK_KEY,

      {}

    );

    const newInventory = {

      ...inventory,

    };

    sale.items?.forEach((item) => {

      const productId =

        item.productId;

      const quantity = Number(

        item.quantity || 0

      );

      newInventory[productId] =

        Number(

          newInventory[productId] ??

            0

        ) + quantity;

    });

    const updatedSales =

      sales.filter(

        (item) =>

          item.billId !==

          sale.billId

      );

    localStorage.setItem(

      STOCK_KEY,

      JSON.stringify(

        newInventory

      )

    );

    localStorage.setItem(

      SALES_KEY,

      JSON.stringify(

        updatedSales

      )

    );

    setSales(updatedSales);

    setSelectedBill(null);

    window.alert(

      "ยกเลิกบิลและคืนสต๊อกเรียบร้อย"

    );

  }

  return (
<div className="bills-page">
<header className="bills-header">
<div>
<h1>บิลย้อนหลัง</h1>
<p>

            ดูรายละเอียดและยกเลิกบิลขาย
</p>
</div>
</header>
<div className="bills-toolbar">
<input

          type="search"

          placeholder="ค้นหาเลขบิล วันที่ หรือสินค้า..."

          value={searchText}

          onChange={(event) =>

            setSearchText(

              event.target.value

            )

          }

        />
<div className="bills-count">

          {filteredSales.length} บิล
</div>
</div>
<div className="bills-layout">
<section className="bills-list-box">

          {filteredSales.length === 0 ? (
<div className="bills-empty">

              ยังไม่มีบิลขาย
</div>

          ) : (

            filteredSales.map(

              (sale) => (
<button

                  type="button"

                  className={

                    selectedBill?.billId ===

                    sale.billId

                      ? "bill-row active"

                      : "bill-row"

                  }

                  key={sale.billId}

                  onClick={() =>

                    setSelectedBill(

                      sale

                    )

                  }
>
<div className="bill-row-main">
<strong>

                      {sale.billId}
</strong>
<span>

                      {sale.soldDate}{" "}

                      {sale.soldTime}
</span>
</div>
<div className="bill-row-value">
<strong>

                      {Number(

                        sale.totalAmount ||

                          0

                      ).toLocaleString()}{" "}

                      บาท
</strong>
<span>

                      {sale.totalQty} ชิ้น
</span>
</div>
</button>

              )

            )

          )}
</section>
<section className="bill-detail-box">

          {!selectedBill ? (
<div className="bills-empty">

              เลือกบิลเพื่อดูรายละเอียด
</div>

          ) : (
<>
<div className="bill-detail-header">
<div>
<h2>

                    {selectedBill.billId}
</h2>
<p>

                    {selectedBill.soldDate}{" "}

                    {selectedBill.soldTime}
</p>
</div>
<button

                  type="button"

                  className="bill-cancel-button"

                  onClick={() =>

                    cancelBill(

                      selectedBill

                    )

                  }
>

                  ยกเลิกบิล
</button>
</div>
<div className="bill-detail-summary">
<div>
<span>ยอดขาย</span>
<strong>

                    {Number(

                      selectedBill.totalAmount ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
<div>
<span>ต้นทุน</span>
<strong>

                    {Number(

                      selectedBill.totalCost ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
<div>
<span>กำไร</span>
<strong>

                    {Number(

                      selectedBill.totalProfit ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
</div>
<div className="bill-items">

                {selectedBill.items?.map(

                  (item, index) => (
<div

                      className="bill-item"

                      key={`${item.productId}-${item.option}-${index}`}
>
<div>
<strong>

                          {item.productName}
</strong>
<span>

                          {item.option}
</span>
</div>
<div className="bill-item-right">
<span>

                          {item.quantity} ×{" "}

                          {item.unitPrice}
</span>
<strong>

                          {Number(

                            item.lineTotal ||

                              0

                          ).toLocaleString()}{" "}

                          บาท
</strong>
</div>
</div>

                  )

                )}
</div>
</>

          )}
</section>
</div>
</div>

  );

}

export default BillsPage;
 