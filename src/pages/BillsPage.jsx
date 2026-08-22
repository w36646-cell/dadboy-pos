import {

  useEffect,

  useMemo,

  useRef,

  useState,

} from "react";

import {

  deleteCloudSale,

  getCloudSales,

  updateCloudSaleAfterItemDelete,

} from "../services/salesService";
 
import {

  restoreCloudStocksFromItems,

} from "../services/productService";

import "./BillsPage.css";

const SALES_KEY =

  "dadboy_sales_v1";

const STOCK_KEY =

  "dadboy_inventory_v2";

const PENDING_SALES_KEY =

  "dadboy_pending_sales_sync_v2";

const PENDING_STOCK_KEY =

  "dadboy_pending_stock_sync_v2";

function readStorage(

  key,

  fallback

) {

  try {

    const saved =

      localStorage.getItem(key);

    return saved

      ? JSON.parse(saved)

      : fallback;

  } catch {

    return fallback;

  }

}

function writeStorage(

  key,

  value

) {

  localStorage.setItem(

    key,

    JSON.stringify(value)

  );

}

function getPendingSales() {

  const result =

    readStorage(

      PENDING_SALES_KEY,

      []

    );

  return Array.isArray(result)

    ? result

    : [];

}

function removePendingSale(

  billId

) {

  const current =

    getPendingSales();

  const remaining =

    current.filter(

      (sale) =>

        sale.billId !== billId

    );

  writeStorage(

    PENDING_SALES_KEY,

    remaining

  );

}

function getPendingStocks() {

  const result =

    readStorage(

      PENDING_STOCK_KEY,

      {}

    );

  if (

    result &&

    typeof result === "object" &&

    !Array.isArray(result)

  ) {

    return result;

  }

  return {};

}

function savePendingStock(

  productId,

  stock

) {

  const current =

    getPendingStocks();

  writeStorage(

    PENDING_STOCK_KEY,

    {

      ...current,

      [String(productId)]:

        Number(stock),

    }

  );

}

function removePendingStock(

  productId

) {

  const current =

    getPendingStocks();

  delete current[

    String(productId)

  ];

  writeStorage(

    PENDING_STOCK_KEY,

    current

  );

}

function mergeSales(

  cloudSales,

  localSales

) {

  const result =

    new Map();

  /*

    ใส่บิล Local ก่อน

    เผื่อมีบิลที่ยังรอ Sync

  */

  (localSales || []).forEach(

    (sale) => {

      if (!sale?.billId) {

        return;

      }

      result.set(

        sale.billId,

        sale

      );

    }

  );

  /*

    ถ้าบิลเดียวกันอยู่บน Cloud

    ให้ข้อมูล Cloud เป็นหลัก

  */

  (cloudSales || []).forEach(

    (sale) => {

      if (!sale?.billId) {

        return;

      }

      const localSale =

        result.get(

          sale.billId

        );

      result.set(

        sale.billId,

        {

          ...localSale,

          ...sale,

          items:

            Array.isArray(

              sale.items

            ) &&

            sale.items.length > 0

              ? sale.items

              : localSale?.items ||

                [],

        }

      );

    }

  );

  return Array.from(

    result.values()

  );

}

function restoreLocalStock(

  sale

) {

  const inventory =

    readStorage(

      STOCK_KEY,

      {}

    );

  const updatedInventory = {

    ...inventory,

  };

  (sale.items || []).forEach(

    (item) => {

      const productId =

        item.productId;

      const quantity =

        Number(

          item.quantity || 0

        );

      if (

        productId ===

          undefined ||

        productId === null

      ) {

        return;

      }

      updatedInventory[

        productId

      ] =

        Number(

          updatedInventory[

            productId

          ] ?? 0

        ) +

        quantity;

    }

  );

  writeStorage(

    STOCK_KEY,

    updatedInventory

  );

  return updatedInventory;

}

function removeLocalBill(

  sales,

  billId

) {

  const updatedSales =

    sales.filter(

      (item) =>

        item.billId !== billId

    );

  writeStorage(

    SALES_KEY,

    updatedSales

  );

  return updatedSales;

}

function BillsPage({

  onInventoryUpdated,

}) {

  const [

    sales,

    setSales,

  ] = useState(() =>

    readStorage(

      SALES_KEY,

      []

    )

  );

  const [

    selectedBill,

    setSelectedBill,

  ] = useState(null);

  const [

    searchText,

    setSearchText,

  ] = useState("");

  const searchInputRef = useRef(null);
 
  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    cloudError,

    setCloudError,

  ] = useState(false);

  const [

    cancelling,

    setCancelling,

  ] = useState(false);

  const [

    isOnline,

    setIsOnline,

  ] = useState(() =>

    typeof navigator ===

    "undefined"

      ? true

      : navigator.onLine

  );

  function updateAppInventory(

    newInventory

  ) {

    if (

      typeof onInventoryUpdated ===

      "function"

    ) {

      onInventoryUpdated(

        newInventory

      );

    }

  }

  useEffect(() => {

    let cancelled =

      false;

    async function loadBills() {

      setLoading(true);

      const localSales =

        readStorage(

          SALES_KEY,

          []

        );

      /*

        Offline:

        แสดงบิลในเครื่องอย่างเดียว

      */

      if (

        typeof navigator !==

          "undefined" &&

        navigator.onLine === false

      ) {

        if (!cancelled) {

          setSales(

            localSales

          );

          setCloudError(true);

          setLoading(false);

        }

        return;

      }

      try {

        const cloudSales =

          await getCloudSales();

        if (cancelled) {

          return;

        }

        const mergedSales =

          mergeSales(

            cloudSales,

            localSales

          );

        setSales(

          mergedSales

        );

        writeStorage(

          SALES_KEY,

          mergedSales

        );

        setCloudError(false);

      } catch (error) {

        console.error(

          "Supabase load bills error:",

          error

        );

        if (cancelled) {

          return;

        }

        setSales(

          localSales

        );

        setCloudError(true);

      } finally {

        if (!cancelled) {

          setLoading(false);

        }

      }

    }

    function handleOnline() {

      setIsOnline(true);

      /*

        เมื่อเน็ตกลับ

        โหลดบิลจาก Cloud ใหม่

      */

      loadBills();

    }

    function handleOffline() {

      setIsOnline(false);

      setCloudError(true);

    }

    loadBills();

    window.addEventListener(

      "online",

      handleOnline

    );

    window.addEventListener(

      "offline",

      handleOffline

    );

    return () => {

      cancelled = true;

      window.removeEventListener(

        "online",

        handleOnline

      );

      window.removeEventListener(

        "offline",

        handleOffline

      );

    };

  }, []);

  const filteredSales =

    useMemo(() => {

      const keyword =

        searchText

          .trim()

          .toLowerCase();

      const result =

        [...sales].sort(

          (a, b) =>

            new Date(

              b.soldAt

            ) -

            new Date(

              a.soldAt

            )

        );

      if (!keyword) {

        return result;

      }

      return result.filter(

        (sale) => {

          const billId =

            String(

              sale.billId || ""

            ).toLowerCase();

          const date =

            String(

              sale.soldDate || ""

            ).toLowerCase();

          const productNames =

            sale.items

              ?.map(

                (item) =>

                  item.productName

              )

              .join(" ")

              .toLowerCase() ||

            "";

          return (

            billId.includes(

              keyword

            ) ||

            date.includes(

              keyword

            ) ||

            productNames.includes(

              keyword

            )

          );

        }

      );

    }, [

      sales,

      searchText,

    ]);

  async function deleteBillItem(

  sale,

  item

) {

  if (

    !sale ||

    !item ||

    cancelling

  ) {

    return;

  }

  if (!isOnline) {

    window.alert(

      "ไม่สามารถลบรายการในบิลขณะ Offline ได้\nกรุณาเชื่อมต่ออินเทอร์เน็ตก่อน"

    );

    return;

  }

  if (

    !Array.isArray(sale.items) ||

    sale.items.length <= 1

  ) {

    const confirmed =

      window.confirm(

        "นี่คือรายการสุดท้ายของบิล\nต้องการยกเลิกบิลนี้ทั้งหมดหรือไม่?"

      );

    if (confirmed) {

      await cancelBill(sale);

    }

    return;

  }

  const confirmed =

    window.confirm(

      `ลบ ${item.productName} ออกจากบิล ${sale.billId} ใช่หรือไม่?\nสต๊อกสินค้านี้จะถูกคืนกลับ`

    );

  if (!confirmed) {

    return;

  }

  setCancelling(true);

  try {

    const restoredStocks =

      await restoreCloudStocksFromItems(

        [item]

      );

    const localInventory =

      readStorage(

        STOCK_KEY,

        {}

      );

    const updatedInventory = {

      ...localInventory,

      ...restoredStocks,

    };

    writeStorage(

      STOCK_KEY,

      updatedInventory

    );

    updateAppInventory(

      updatedInventory

    );

    Object.keys(

      restoredStocks || {}

    ).forEach(

      (productId) => {

        removePendingStock(

          productId

        );

      }

    );

    const updatedSale =

      await updateCloudSaleAfterItemDelete(

        sale,

        item

      );

    const updatedSales =

      sales.map(

        (currentSale) =>

          currentSale.billId ===

          sale.billId

            ? updatedSale

            : currentSale

      );

    writeStorage(

      SALES_KEY,

      updatedSales

    );

    setSales(

      updatedSales

    );

    setSelectedBill(

      updatedSale

    );

    window.alert(

      "ลบรายการออกจากบิลเรียบร้อย\nคืนสต๊อกและปรับยอดบิลแล้ว"

    );

  } catch (error) {

    console.error(

      "Delete bill item error:",

      error

    );

    window.alert(

      "ลบรายการไม่สำเร็จ\nกรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่"

    );

  } finally {

    setCancelling(false);

  }

}
 

  async function cancelBill(

    sale

  ) {

    if (

      !sale ||

      cancelling

    ) {

      return;

    }

    /*

      ==================================

      กติกาใหม่:

      Offline ห้ามยกเลิกบิลทุกกรณี

      ==================================

    */

    if (!isOnline) {

      window.alert(

        "ไม่สามารถยกเลิกบิลขณะ Offline ได้\nกรุณาเชื่อมต่ออินเทอร์เน็ตก่อนยกเลิกบิล"

      );

      return;

    }

    const confirmed =

      window.confirm(

        `ยกเลิกบิล ${sale.billId} ใช่หรือไม่?\nสต๊อกสินค้าจะถูกคืนกลับ`

      );

    if (!confirmed) {

      return;

    }

    setCancelling(true);

    try {

      /*

        ==================================

        CASE 1

        บิลอยู่บน Cloud แล้ว

        ==================================

      */

      if (sale.id) {

        /*

          คืน Stock บน Supabase

        */

        const restoredStocks =

          await restoreCloudStocksFromItems(

            sale.items || []

          );

        /*

          เอา Stock ใหม่มาเขียน Local

        */

        const localInventory =

          readStorage(

            STOCK_KEY,

            {}

          );

        const updatedInventory = {

          ...localInventory,

          ...restoredStocks,

        };

        writeStorage(

          STOCK_KEY,

          updatedInventory

        );

        /*

          อัปเดต React State

          เพื่อให้หน้า POS เปลี่ยนทันที

        */

        updateAppInventory(

          updatedInventory

        );

        /*

          Stock เหล่านี้ Sync Cloud แล้ว

          เอาออกจาก Pending

        */

        Object.keys(

          restoredStocks || {}

        ).forEach(

          (productId) => {

            removePendingStock(

              productId

            );

          }

        );

        /*

          ลบ sale_items + sales

          จาก Supabase

        */

        await deleteCloudSale(
sale.id

        );

        /*

          ป้องกันบิลนี้ค้างใน Pending Sale

        */

        removePendingSale(

          sale.billId

        );

        /*

          ลบบิลออกจาก Local

        */

        const updatedSales =

          removeLocalBill(

            sales,

            sale.billId

          );

        setSales(

          updatedSales

        );

        setSelectedBill(null);

        window.alert(

          "ยกเลิกบิลเรียบร้อย\nคืนสต๊อกทั้ง POS และ Cloud แล้ว"

        );

        return;

      }

      /*

        ==================================

        CASE 2

        บิล Local ที่ยังไม่ขึ้น Cloud

        ถึงแม้เป็น Local

        ก็เข้ามาตรงนี้ได้เฉพาะตอน Online

        ==================================

      */

      const updatedInventory =

        restoreLocalStock(

          sale

        );

      /*

        ให้หน้า POS เห็น Stock ใหม่ทันที

      */

      updateAppInventory(

        updatedInventory

      );

      /*

        บิลถูกยกเลิกแล้ว

        ห้าม Sync ขึ้น Cloud

      */

      removePendingSale(

        sale.billId

      );

      /*

        Stock ที่คืนแล้วต้อง Sync

        ขึ้น Cloud

      */

      (sale.items || []).forEach(

        (item) => {

          const productId =

            item.productId;

          if (

            productId ===

              undefined ||

            productId === null

          ) {

            return;

          }

          savePendingStock(

            productId,

            updatedInventory[

              productId

            ]

          );

        }

      );

      /*

        ลบบิล Local

      */

      const updatedSales =

        removeLocalBill(

          sales,

          sale.billId

        );

      setSales(

        updatedSales

      );

      setSelectedBill(null);

      window.alert(

        "ยกเลิกบิลและคืนสต๊อกเรียบร้อย\nStock จะ Sync ขึ้น Cloud อัตโนมัติ"

      );

    } catch (error) {

      console.error(

        "Cancel bill error:",

        error

      );

      window.alert(

        "ยกเลิกบิลไม่สำเร็จ\nกรุณาตรวจสอบการเชื่อมต่อแล้วลองใหม่"

      );

    } finally {

      setCancelling(false);

    }

  }

  return (
<div className="bills-page">
<header className="bills-header">
<div>
<h1>

            บิลย้อนหลัง
</h1>
<p>

            ดูรายละเอียดและยกเลิกบิลขาย
</p>
</div>
<div

          style={{

            padding:

              "7px 11px",

            borderRadius:

              "999px",

            fontSize:

              "12px",

            fontWeight:

              700,

            background:

              isOnline

                ? "#ecfdf3"

                : "#fff7ed",

            color:

              isOnline

                ? "#067647"

                : "#9a3412",

            border:

              isOnline

                ? "1px solid #abefc6"

                : "1px solid #fed7aa",

          }}
>

          {isOnline

            ? "● ออนไลน์"

            : "● ออฟไลน์"}
</div>
</header>

      {!isOnline && (
<div

          style={{

            marginBottom:

              "12px",

            padding:

              "11px 14px",

            borderRadius:

              "10px",

            background:

              "#fff7ed",

            color:

              "#9a3412",

            border:

              "1px solid #fed7aa",

            fontSize:

              "13px",

            fontWeight:

              600,

          }}
>

          ขณะ Offline สามารถดูบิลได้

          แต่ไม่สามารถยกเลิกบิลได้

          กรุณาเชื่อมต่ออินเทอร์เน็ตก่อน
</div>

      )}

      {cloudError &&

        isOnline && (
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

            ตอนนี้กำลังแสดงบิลสำรองจากเครื่อง
</div>

        )}
<div className="bills-toolbar">
 
<div

  style={{

    position: "relative",

    flex: "1 1 520px",

    minWidth: "320px",

  }}
>
<input

    ref={searchInputRef}

    type="search"

    placeholder="ค้นหาเลขบิล วันที่ หรือสินค้า..."

    value={searchText}

    onChange={(event) =>

      setSearchText(

        event.target.value

      )

    }

    style={{

      width: "100%",

      paddingRight: searchText

        ? "48px"

        : undefined,

    }}

  />

  {searchText && (
<button

      type="button"

      aria-label="ล้างคำค้นหา"

      onPointerDown={(event) => {

        event.preventDefault();

      }}

      onClick={() => {

        setSearchText("");

        requestAnimationFrame(() => {

          searchInputRef.current?.focus({

            preventScroll: true,

          });

        });

      }}

      style={{

        position: "absolute",

        right: "10px",

        top: "50%",

        transform: "translateY(-50%)",

        width: "32px",

        height: "32px",

        minWidth: "32px",

        padding: 0,

        margin: 0,

        border: "none",

        borderRadius: "50%",

        background: "#e5e7eb",

        color: "#475467",

        fontSize: "22px",

        fontWeight: "700",

        lineHeight: "1",

        display: "flex",

        alignItems: "center",

        justifyContent: "center",

        cursor: "pointer",

        zIndex: 5,

        touchAction: "manipulation",

        WebkitTapHighlightColor: "transparent",

      }}
>

      ×
</button>

  )}
</div>
  
 <div className="bills-count">

          {loading

            ? "กำลังโหลด..."

            : `${filteredSales.length} บิล`}
</div>
</div>
<div className="bills-layout">
<section className="bills-list-box">

          {loading ? (
<div className="bills-empty">

              กำลังโหลดบิล...
</div>

          ) : filteredSales.length ===

            0 ? (
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

                  key={

                    sale.billId

                  }

                  onClick={() =>

                    setSelectedBill(

                      sale

                    )

                  }
>
<div className="bill-row-main">
<strong>

                      {

                        sale.billId

                      }
</strong>
<span>

                      {

                        sale.soldDate

                      }{" "}

                      {

                        sale.soldTime

                      }
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

                      {

                        sale.totalQty

                      }{" "}

                      ชิ้น
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

                    {

                      selectedBill.billId

                    }
</h2>
<p>

                    {

                      selectedBill.soldDate

                    }{" "}

                    {

                      selectedBill.soldTime

                    }
</p>
</div>
<button

                  type="button"

                  className="bill-cancel-button"

                  disabled={

                    cancelling ||

                    !isOnline

                  }

                  onClick={() =>

                    cancelBill(

                      selectedBill

                    )

                  }

                  title={

                    !isOnline

                      ? "ต้องออนไลน์ก่อนจึงจะยกเลิกบิลได้"

                      : ""

                  }
>

                  {cancelling

                    ? "กำลังยกเลิก..."

                    : !isOnline

                      ? "ยกเลิกไม่ได้ขณะ Offline"

                      : "ยกเลิกบิล"}
</button>
</div>

              {!isOnline && (
<div

                  style={{

                    marginBottom:

                      "12px",

                    padding:

                      "8px 10px",

                    borderRadius:

                      "8px",

                    background:

                      "#fff7ed",

                    color:

                      "#9a3412",

                    fontSize:

                      "12px",

                  }}
>

                  ต้องเชื่อมต่ออินเทอร์เน็ตก่อนจึงจะยกเลิกบิลนี้ได้
</div>

              )}
<div className="bill-detail-summary">
<div>
<span>

                    ยอดขาย
</span>
<strong>

                    {Number(

                      selectedBill.totalAmount ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
<div>
<span>

                    ต้นทุน
</span>
<strong>

                    {Number(

                      selectedBill.totalCost ||

                        0

                    ).toLocaleString()}{" "}

                    บาท
</strong>
</div>
<div>
<span>

                    กำไร
</span>
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

                {selectedBill.items

                  ?.length > 0 ? (

                  selectedBill.items.map(

                    (

                      item,

                      index

                    ) => (
<div

                        className="bill-item"

                        key={`${item.productId}-${item.option}-${index}`}
>
<div>
<strong>

                            {

                              item.productName

                            }
</strong>
<span>

                            {

                              item.option

                            }
</span>
</div>
<div className="bill-item-right">
<span>

    {item.quantity} × {item.unitPrice}
</span>
<strong>

    {Number(

      item.lineTotal || 0

    ).toLocaleString()}{" "}

    บาท
</strong>
<button

    type="button"

    onClick={() =>

      deleteBillItem(

        selectedBill,

        item

      )

    }

    disabled={

      cancelling ||

      !isOnline

    }

    style={{

      marginTop: "6px",

      padding: "6px 10px",

      borderRadius: "8px",

      border: "1px solid #fca5a5",

      background: "#fff1f2",

      color: "#b42318",

      fontWeight: 700,

      cursor:

        cancelling ||

        !isOnline

          ? "not-allowed"

          : "pointer",

      opacity:

        cancelling ||

        !isOnline

          ? 0.5

          : 1,

    }}
>

    ลบรายการ
</button>
</div>
 
</div>

                    )

                  )

                ) : (
<div className="bills-empty">

                    ไม่มีรายละเอียดสินค้าในบิลนี้
</div>

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
 
