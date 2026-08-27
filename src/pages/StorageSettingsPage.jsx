import {

  useEffect,

  useState,

} from "react";

import "./StorageSettingsPage.css";

const PRODUCTS_KEY =

  "dadboy_products_v1";

const STOCK_KEY =

  "dadboy_inventory_v2";

const CART_KEY =

  "dadboy_active_cart_v1";

const OLD_SALES_KEY =

  "dadboy_sales_v1";

const OWNER_PIN_KEY =

  "dadboy_owner_pin";

const PENDING_SALES_KEY =

  "dadboy_pending_sales_sync_v2";

const PENDING_STOCK_KEY =

  "dadboy_pending_stock_sync_v2";

const PENDING_ADJUSTMENTS_KEY =

  "dadboy_pending_stock_adjustments_v1";


function getByteSize(value) {

  try {

    return new Blob([

      String(value || ""),

    ]).size;

  } catch {

    return String(

      value || ""

    ).length * 2;

  }

}


function formatBytes(bytes) {

  const value =

    Number(bytes || 0);

  if (value < 1024) {

    return `${value} B`;

  }

  if (

    value <

    1024 * 1024

  ) {

    return `${(

      value / 1024

    ).toFixed(1)} KB`;

  }

  return `${(

    value /

    1024 /

    1024

  ).toFixed(2)} MB`;

}


function readJson(

  key,

  fallback

) {

  try {

    const value =

      localStorage.getItem(

        key

      );

    if (!value) {

      return fallback;

    }

    return JSON.parse(

      value

    );

  } catch {

    return fallback;

  }

}


function isEmptyPending(

  key

) {

  const value =

    readJson(

      key,

      null

    );

  if (

    Array.isArray(value)

  ) {

    return (

      value.length === 0

    );

  }

  if (

    value &&

    typeof value ===

      "object"

  ) {

    return (

      Object.keys(value)

        .length === 0

    );

  }

  return value == null;

}


function getLocalStorageRows() {

  const labels = {

    [PRODUCTS_KEY]:

      "สินค้า + รูปสินค้า",

    [STOCK_KEY]:

      "Stock ในเครื่อง",

    [CART_KEY]:

      "ตะกร้าปัจจุบัน",

    [OLD_SALES_KEY]:

      "ประวัติบิลรุ่นเก่า",

    [OWNER_PIN_KEY]:

      "PIN เจ้าของร้าน",

    [PENDING_SALES_KEY]:

      "บิลรอ Sync",

    [PENDING_STOCK_KEY]:

      "Stock รอ Sync",

    [PENDING_ADJUSTMENTS_KEY]:

      "ปรับ Stock / กินเอง รอ Sync",

  };

  const rows = [];

  for (

    let index = 0;

    index <

    localStorage.length;

    index += 1

  ) {

    const key =

      localStorage.key(

        index

      );

    if (!key) {

      continue;

    }

    const value =

      localStorage.getItem(

        key

      ) || "";

    rows.push({

      key,

      label:

        labels[key] ||

        "ข้อมูลอื่น",

      bytes:

        getByteSize(key) +

        getByteSize(value),

      isOld:

        key ===

        OLD_SALES_KEY,

      isDadboy:

        key.startsWith(

          "dadboy_"

        ),

    });

  }

  return rows.sort(

    (a, b) =>

      b.bytes -

      a.bytes

  );

}


async function getCacheInfo() {

  if (

    !("caches" in window)

  ) {

    return {

      supported: false,

      totalBytes: 0,

      totalFiles: 0,

      caches: [],

    };

  }

  const names =

    await caches.keys();

  let totalBytes = 0;

  let totalFiles = 0;

  const cacheRows = [];

  for (

    const name of names

  ) {

    const cache =

      await caches.open(

        name

      );

    const requests =

      await cache.keys();

    let cacheBytes = 0;

    for (

      const request of

      requests

    ) {

      try {

        const response =

          await cache.match(

            request

          );

        if (!response) {

          continue;

        }

        const blob =

          await response

            .clone()

            .blob();

        cacheBytes +=

          blob.size;

      } catch {

        // ถ้าอ่านขนาดไม่ได้

        // ยังนับจำนวนไฟล์ได้

      }

    }

    totalBytes +=

      cacheBytes;

    totalFiles +=

      requests.length;

    cacheRows.push({

      name,

      bytes:

        cacheBytes,

      files:

        requests.length,

    });

  }

  return {

    supported: true,

    totalBytes,

    totalFiles,

    caches:

      cacheRows,

  };

}


function StorageSettingsPage({

  isOnline,

  cloudReady,

  pendingSaleCount,

  pendingStockCount,

  pendingAdjustmentCount,

  onSync,

}) {

  const [

    loading,

    setLoading,

  ] = useState(true);

  const [

    cleaning,

    setCleaning,

  ] = useState(false);

  const [

    localRows,

    setLocalRows,

  ] = useState([]);

  const [

    cacheInfo,

    setCacheInfo,

  ] = useState({

    supported: true,

    totalBytes: 0,

    totalFiles: 0,

    caches: [],

  });

  const [

    storageEstimate,

    setStorageEstimate,

  ] = useState(null);


  async function refreshInfo() {

    setLoading(true);

    try {

      setLocalRows(

        getLocalStorageRows()

      );

      const nextCache =

        await getCacheInfo();

      setCacheInfo(

        nextCache

      );

      if (

        navigator.storage

          ?.estimate

      ) {

        const estimate =

          await navigator

            .storage

            .estimate();

        setStorageEstimate({

          usage:

            Number(

              estimate.usage ||

                0

            ),

          quota:

            Number(

              estimate.quota ||

                0

            ),

        });

      } else {

        setStorageEstimate(

          null

        );

      }

    } catch (error) {

      console.error(

        "Storage inspect error:",

        error

      );

    } finally {

      setLoading(false);

    }

  }


  useEffect(() => {

    refreshInfo();

  }, []);


  const localBytes =

    localRows.reduce(

      (

        total,

        item

      ) =>

        total +

        Number(

          item.bytes || 0

        ),

      0

    );


  const oldSalesBytes =

    localRows

      .filter(

        (item) =>

          item.key ===

          OLD_SALES_KEY

      )

      .reduce(

        (

          total,

          item

        ) =>

          total +

          item.bytes,

        0

      );


  const pendingTotal =

    Number(

      pendingSaleCount ||

        0

    ) +

    Number(

      pendingStockCount ||

        0

    ) +

    Number(

      pendingAdjustmentCount ||

        0

    );


  const safeToClean =

    isOnline &&

    pendingTotal === 0;


  async function syncNow() {

    if (

      typeof onSync !==

      "function"

    ) {

      return;

    }

    try {

      await onSync();

      window.setTimeout(

        refreshInfo,

        300

      );

    } catch (error) {

      console.error(

        "Manual sync error:",

        error

      );

    }

  }


  async function cleanSafely() {

    if (

      pendingTotal > 0

    ) {

      window.alert(

        "ยังมีข้อมูลรอ Sync\nกรุณา Sync ให้เรียบร้อยก่อนล้างขยะ"

      );

      return;

    }

    if (!isOnline) {

      window.alert(

        "กรุณาเชื่อมต่ออินเทอร์เน็ตก่อนล้าง Cache"

      );

      return;

    }

    const confirmed =

      window.confirm(

        [

          "ต้องการล้างขยะในเครื่องหรือไม่?",

          "",

          "ระบบจะลบ:",

          "• ประวัติบิล Local รุ่นเก่า",

          "• Pending key ที่ว่างแล้ว",

          "• Cache ของ Dadboy POS แล้วสร้างใหม่",

          "",

          "ระบบจะไม่ลบ:",

          "• สินค้า",

          "• Stock ปัจจุบัน",

          "• ตะกร้าที่ยังมีสินค้า",

          "• PIN เจ้าของร้าน",

        ].join("\n")

      );

    if (!confirmed) {

      return;

    }

    setCleaning(true);

    try {

      /*

        1. ลบ Sales cache

        รุ่นเก่าที่ไม่ใช้แล้ว

      */

      localStorage.removeItem(

        OLD_SALES_KEY

      );


      /*

        2. Pending ที่ว่างแล้ว

        ลบ key ทิ้งได้

      */

      const pendingKeys = [

        PENDING_SALES_KEY,

        PENDING_STOCK_KEY,

        PENDING_ADJUSTMENTS_KEY,

      ];

      pendingKeys.forEach(

        (key) => {

          if (

            isEmptyPending(

              key

            )

          ) {

            localStorage

              .removeItem(

                key

              );

          }

        }

      );


      /*

        3. ล้าง Cache Dadboy

        ทั้งชุด

        ตอน Reload

        Service Worker จะโหลด

        ไฟล์รุ่นปัจจุบันใหม่

      */

      if (

        "caches" in window

      ) {

        const names =

          await caches.keys();

        const dadboyCaches =

          names.filter(

            (name) =>

              name.startsWith(

                "dadboy-pos"

              )

          );

        await Promise.all(

          dadboyCaches.map(

            (name) =>

              caches.delete(

                name

              )

          )

        );

      }


      window.alert(

        "ล้างขยะเรียบร้อย\nระบบจะโหลดหน้าใหม่เพื่อสร้าง Cache ปัจจุบัน"

      );

      window.setTimeout(

        () => {

          window.location

            .reload();

        },

        300

      );

    } catch (error) {

      console.error(

        "Safe cleanup error:",

        error

      );

      window.alert(

        "ล้างขยะไม่สำเร็จ\nกรุณาลองใหม่อีกครั้ง"

      );

      setCleaning(false);

    }

  }


  return (
<div className="storage-page">
<div className="storage-header">
<div>
<h1>

            พื้นที่ข้อมูลในเครื่อง
</h1>
<p>

            ตรวจสอบ Local Storage

            และ Cache ของ Dadboy POS
</p>
</div>
<button

          type="button"

          className="storage-refresh-button"

          onClick={

            refreshInfo

          }

          disabled={

            loading ||

            cleaning

          }
>

          {loading

            ? "กำลังตรวจ..."

            : "ตรวจใหม่"}
</button>
</div>

<div className="storage-status-grid">
<div className="storage-card">
<span>

            Local Storage
</span>
<strong>

            {formatBytes(

              localBytes

            )}
</strong>
</div>

<div className="storage-card">
<span>

            Cache Storage
</span>
<strong>

            {formatBytes(

              cacheInfo

                .totalBytes

            )}
</strong>
<small>

            {

              cacheInfo

                .totalFiles

            }{" "}

            ไฟล์
</small>
</div>

<div className="storage-card">
<span>

            ข้อมูลรอ Sync
</span>
<strong>

            {pendingTotal}
</strong>
<small>

            รายการ
</small>
</div>

<div className="storage-card">
<span>

            สถานะ
</span>
<strong

            className={

              safeToClean

                ? "storage-good"

                : "storage-warning"

            }
>

            {safeToClean

              ? "พร้อมล้าง"

              : "ยังไม่พร้อม"}
</strong>
</div>
</div>


      {storageEstimate && (
<div className="storage-origin-usage">

          พื้นที่เว็บไซต์ทั้งหมดประมาณ{" "}
<strong>

            {formatBytes(

              storageEstimate

                .usage

            )}
</strong>

          {storageEstimate

            .quota > 0 && (
<>

              {" "}

              จากโควตาประมาณ{" "}
<strong>

                {formatBytes(

                  storageEstimate

                    .quota

                )}
</strong>
</>

          )}
</div>

      )}

<section className="storage-section">
<h2>

          สถานะ Sync
</h2>
<div className="storage-sync-list">
<div>
<span>

              Internet
</span>
<strong>

              {isOnline

                ? "ออนไลน์"

                : "ออฟไลน์"}
</strong>
</div>
<div>
<span>

              Cloud
</span>
<strong>

              {cloudReady

                ? "เรียบร้อย"

                : "มีข้อมูลรอ Sync"}
</strong>
</div>
<div>
<span>

              บิลรอ Sync
</span>
<strong>

              {

                pendingSaleCount

              }
</strong>
</div>
<div>
<span>

              Stock รอ Sync
</span>
<strong>

              {

                pendingStockCount

              }
</strong>
</div>
<div>
<span>

              ปรับ Stock /

              กินเอง รอ Sync
</span>
<strong>

              {

                pendingAdjustmentCount

              }
</strong>
</div>
</div>
<button

          type="button"

          className="storage-sync-button"

          onClick={syncNow}

          disabled={

            !isOnline ||

            cleaning

          }
>

          Sync ตอนนี้
</button>
</section>

<section className="storage-section">
<h2>

          ข้อมูลใน Local Storage
</h2>
<div className="storage-table-wrap">
<table className="storage-table">
<thead>
<tr>
<th>

                  ข้อมูล
</th>
<th>

                  Key
</th>
<th>

                  ขนาด
</th>
<th>

                  สถานะ
</th>
</tr>
</thead>
<tbody>

              {localRows.map(

                (item) => (
<tr

                    key={

                      item.key

                    }
>
<td>

                      {

                        item.label

                      }
</td>
<td>
<code>

                        {

                          item.key

                        }
</code>
</td>
<td>

                      {formatBytes(

                        item.bytes

                      )}
</td>
<td>

                      {item.isOld

                        ? "ขยะเก่า"

                        : item

                            .isDadboy

                          ? "ใช้งาน"

                          : "ตรวจสอบ"}
</td>
</tr>

                )

              )}

              {localRows.length ===

                0 && (
<tr>
<td

                    colSpan="4"
>

                    ไม่มีข้อมูล

                    Local Storage
</td>
</tr>

              )}
</tbody>
</table>
</div>
</section>

<section className="storage-section">
<h2>

          Cache Storage
</h2>

        {!cacheInfo.supported ? (
<p>

            Browser นี้ไม่รองรับ

            Cache Storage
</p>

        ) : (
<>

            {cacheInfo.caches.map(

              (item) => (
<div

                  className="storage-cache-row"

                  key={

                    item.name

                  }
>
<div>
<strong>

                      {

                        item.name

                      }
</strong>
<small>

                      {

                        item.files

                      }{" "}

                      ไฟล์
</small>
</div>
<strong>

                    {formatBytes(

                      item.bytes

                    )}
</strong>
</div>

              )

            )}

            {cacheInfo.caches

              .length ===

              0 && (
<p>

                ยังไม่มี Cache
</p>

            )}
</>

        )}
</section>


      {oldSalesBytes > 0 && (
<div className="storage-garbage-warning">

          พบประวัติบิล Local

          รุ่นเก่าประมาณ{" "}
<strong>

            {formatBytes(

              oldSalesBytes

            )}
</strong>{" "}

          ซึ่งระบบปัจจุบันไม่ใช้แล้ว
</div>

      )}

<button

        type="button"

        className="storage-clean-button"

        onClick={

          cleanSafely

        }

        disabled={

          cleaning ||

          !safeToClean

        }
>

        {cleaning

          ? "กำลังล้าง..."

          : "ล้างขยะปลอดภัย"}
</button>


      {!safeToClean && (
<p className="storage-clean-note">

          {!isOnline

            ? "ต้องออนไลน์ก่อนจึงจะล้าง Cache ได้"

            : "ยังมีข้อมูลรอ Sync กรุณา Sync ให้เรียบร้อยก่อน"}
</p>

      )}
</div>

  );

}


export default StorageSettingsPage;
 
