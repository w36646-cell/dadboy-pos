import {

  useMemo,

  useRef,

  useState,

} from "react";


function parseProductImageSettings(value) {

  const defaults = {

    src: "",

    scale: 1,

    x: 0,

    y: 0,

  };

  if (!value) {

    return defaults;

  }

  if (

    typeof value !== "string" ||

    !value.trim().startsWith("{")

  ) {

    return {

      ...defaults,

      src: String(value || ""),

    };

  }

  try {

    const parsed =

      JSON.parse(value);

    return {

      src: String(

        parsed.src || ""

      ),

      scale: Number(

        parsed.scale || 1

      ),

      x: Number(

        parsed.x || 0

      ),

      y: Number(

        parsed.y || 0

      ),

    };

  } catch {

    return {

      ...defaults,

      src: String(value || ""),

    };

  }

}


function StockAdjustment({

  products,

  inventory,

  onAdjustStock,

  onClose,

}) {

  const [

    searchText,

    setSearchText,

  ] = useState("");

 const searchInputRef = useRef(null);

  const adjustmentFormRef =

    useRef(null);

  const actualStockInputRef =

    useRef(null);

  const adjustmentTableScrollRef =
 
    useRef(null);

  const adjustmentStickyScrollRef =

    useRef(null);


  function syncFromAdjustmentTable(

    event

  ) {

    const sticky =

      adjustmentStickyScrollRef.current;

    if (!sticky) {

      return;

    }

    if (

      Math.abs(

        sticky.scrollLeft -

        event.currentTarget.scrollLeft

      ) > 1

    ) {

      sticky.scrollLeft =

        event.currentTarget.scrollLeft;

    }

  }


  function syncFromAdjustmentStickyHeader(

    event

  ) {

    const table =

      adjustmentTableScrollRef.current;

    if (!table) {

      return;

    }

    if (

      Math.abs(

        table.scrollLeft -

        event.currentTarget.scrollLeft

      ) > 1

    ) {

      table.scrollLeft =

        event.currentTarget.scrollLeft;

    }

  }

  const [

    selectedProduct,

    setSelectedProduct,

  ] = useState(null);

  const [

    actualStock,

    setActualStock,

  ] = useState("");

  const [

    reason,

    setReason,

  ] = useState(

    "ตรวจนับประจำสัปดาห์"

  );

  const [

    note,

    setNote,

  ] = useState("");


  const filteredProducts =

    useMemo(() => {

      const keyword =

        searchText

          .trim()

          .toLowerCase();

      if (!keyword) {

        return products;

      }

      return products.filter(

        (product) =>

          String(

            product.name || ""

          )

            .toLowerCase()

            .includes(keyword)

      );

    }, [

      products,

      searchText,

    ]);


  function selectProduct(

    product

  ) {

    const currentStock =

      Number(

        inventory[
product.id

        ] ?? 0

      );

    setSelectedProduct(

      product

    );

    setActualStock(

      String(

        currentStock

      )

    );

    setReason(

      "ตรวจนับประจำสัปดาห์"

    );

    setNote("");


    window.setTimeout(

      () => {

        adjustmentFormRef.current

          ?.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

        window.setTimeout(() => {

          actualStockInputRef.current

            ?.focus({

              preventScroll: true,

            });

          actualStockInputRef.current

            ?.select();

        }, 350);

      },

      60

    );
 
  }

  const currentStock =

    selectedProduct

      ? Number(

          inventory[
selectedProduct.id

          ] ?? 0

        )

      : 0;


  const actualNumber =

    Number(

      actualStock

    );


  const validActualStock =

    actualStock !== "" &&

    Number.isFinite(

      actualNumber

    ) &&

    actualNumber >= 0;


  const difference =

    validActualStock

      ? actualNumber -

        currentStock

      : 0;


  function getDifferenceText() {

    if (

      !validActualStock

    ) {

      return "-";

    }

    if (

      difference > 0

    ) {

      return `+${difference}`;

    }

    return String(

      difference

    );

  }


  function confirmAdjustment() {

    if (

      !selectedProduct

    ) {

      return;

    }

    if (

      !validActualStock

    ) {

      window.alert(

        "กรุณาใส่ยอดสต๊อกที่นับได้จริง"

      );

      return;

    }

    if (

      !Number.isInteger(

        actualNumber

      )

    ) {

      window.alert(

        "จำนวนสต๊อกต้องเป็นจำนวนเต็ม"

      );

      return;

    }

    if (

      difference === 0

    ) {

      window.alert(

        "ยอดที่นับได้ตรงกับระบบอยู่แล้ว ไม่ต้องปรับสต๊อก"

      );

      return;

    }

    const direction =

      difference > 0

        ? "เพิ่ม"

        : "ลด";

    const confirmText =

      [

        `สินค้า: ${selectedProduct.name}`,

        `ยอดในระบบ: ${currentStock}`,

        `ยอดที่นับได้จริง: ${actualNumber}`,

        `ปรับ${direction}: ${Math.abs(

          difference

        )}`,

        `เหตุผล: ${reason}`,

        "",

        "ยืนยันการปรับสต๊อกหรือไม่?",

      ].join("\n");

    const confirmed =

      window.confirm(

        confirmText

      );

    if (!confirmed) {

      return;

    }

    onAdjustStock({

      productId:
selectedProduct.id,

      productName:

        selectedProduct.name,

      previousStock:

        currentStock,

      actualStock:

        actualNumber,

      difference,

      reason,

      note:

        note.trim(),

      adjustedAt:

        new Date()

          .toISOString(),

    });

    setSelectedProduct(

      null

    );

    setActualStock("");

    setReason(

      "ตรวจนับประจำสัปดาห์"

    );

    setNote("");

  }


  function handleKeyDown(

    event

  ) {

    if (

      event.key ===

      "Enter"

    ) {

      event.preventDefault();

      confirmAdjustment();

    }

  }


  return (
<div className="stock-page">
<div className="stock-page-header">
<div>
<h1>

            ปรับยอดสต๊อก
</h1>
<p>

            ใช้หลังตรวจนับสินค้า

            เพื่อให้ยอดในระบบ

            ตรงกับของจริง
</p>
</div>

<button

          className="stock-close-button"

          type="button"

          onClick={

            onClose

          }
>

          กลับหน้าขาย
</button>
</div>

<div

        style={{

          padding:

            "12px 14px",

          marginBottom:

            "14px",

          borderRadius:

            "10px",

          background:

            "#fff7ed",

          color:

            "#9a3412",

          fontSize:

            "13px",

        }}
>

        หน้านี้เป็นการตั้งยอดสต๊อกจริง

        ไม่ใช่การรับสินค้าเข้า

        กรุณาตรวจนับสินค้าก่อนยืนยัน
</div>

<div

  style={{

    position: "relative",

    width: "100%",

  }}
>
<input

    ref={searchInputRef}

    className="search-input"

    type="search"

    placeholder="ค้นหาสินค้าที่จะปรับสต๊อก..."

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

        right: "12px",

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
 
<div className="stock-layout">
<div className="product-table-column">
<div

  className="product-table-sticky-wrap"

  ref={adjustmentStickyScrollRef}

  onScroll={syncFromAdjustmentStickyHeader}
>
<table className="product-table stock-adjustment-sync-table">
<thead>
 
<tr>
<th>

  รูป
</th>
<th>

  ชื่อสินค้า
</th>
<th>

  คงเหลือ
</th>
<th>

  Min
</th>
<th>

  บรรจุ / แพ็ก
</th>
</tr>
</thead>
</table>
</div>

<div

  className="product-table-wrap"

  ref={adjustmentTableScrollRef}

  onScroll={syncFromAdjustmentTable}
>
<table className="product-table stock-adjustment-sync-table">
<thead className="sticky-table-header">
 
<tr>
<th>

                  รูป
</th>
<th>

                  ชื่อสินค้า
</th>
<th>

                  คงเหลือ
</th>
<th>

                  Min
</th>
<th>

                  บรรจุ / แพ็ก
</th>
</tr>
</thead>
 
<tbody>

              {filteredProducts.map(

                (product) => {

                  const stock =

                    Number(

                      inventory[
product.id

                      ] ?? 0

                    );

                  const minStock =

                    Number(

                      product.minStock ??

                        5

                    );

                  const packQty =

                    Math.max(

                      1,

                      Number(

                        product.packQty ??

                          1

                      ) || 1

                    );

                  const imageSettings =

                    parseProductImageSettings(

                      product.image

                    );

                  const selected =

                    selectedProduct?.id ===
product.id;

                  const isLow =

                    product.trackStock !==

                      false &&

                    stock <=

                      minStock;

                  return (
<tr

                      key={
product.id

                      }

                      data-product-id={
product.id

                      }

                      onClick={() =>

                        selectProduct(

                          product

                        )

                      }

                      style={{

                        cursor:

                          "pointer",

                        background:

                          selected

                            ? "#e3f2fd"

                            : undefined,

                      }}
>
<td>
<div className="manager-image-box">

                          {imageSettings.src ? (
<img

                              src={

                                imageSettings.src

                              }

                              alt={

                                product.name

                              }

                            />

                          ) : (
<span>

                              ไม่มีรูป
</span>

                          )}
</div>
</td>

<td>
<strong>

                          {

                            product.name

                          }
</strong>
</td>

<td>
<strong

                          className={

                            isLow

                              ? "stock-negative"

                              : ""

                          }
>

                          {

                            stock

                          }
</strong>

                        {" "}ชิ้น
</td>

<td>

                        {

                          minStock

                        }
</td>

<td>

                        {packQty >= 2

                          ? `${packQty} ชิ้น`

                          : "-"}
</td>
</tr>

                  );

                }

              )}
</tbody>
</table>
</div>

</div>

<aside

  ref={adjustmentFormRef}

  className="stock-form-panel"

  style={{

    position: "relative",

  }}
>

          {selectedProduct && (
<button

    type="button"

    aria-label="ปิดรายการปรับสต๊อก"

    onClick={() => {

      const currentId =

        selectedProduct?.id;

      setSelectedProduct(null);

      setActualStock("");

      setReason(

        "ตรวจนับประจำสัปดาห์"

      );

      setNote("");


      requestAnimationFrame(() => {

        const currentRow =

          document.querySelector(

            `tr[data-product-id="${currentId}"]`

          );

        const nextRow =

          currentRow?.nextElementSibling;

        if (nextRow) {

          nextRow.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

        } else {

          currentRow?.scrollIntoView({

            behavior: "smooth",

            block: "start",

          });

        }

      });

    }}

    style={{

      position: "absolute",

      top: "10px",

      right: "10px",

      width: "38px",

      height: "38px",

      padding: 0,

      border: "none",

      borderRadius: "50%",

      background: "#e5e7eb",

      color: "#475467",

      fontSize: "24px",

      fontWeight: "700",

      display: "flex",

      alignItems: "center",

      justifyContent: "center",

      cursor: "pointer",

      zIndex: 10,

    }}
>

    ×
</button>

)}

          {!selectedProduct ? (
 
<div className="stock-form-empty">

              เลือกสินค้าที่ต้องการปรับยอด
</div>

          ) : (
<>

<div

                className="manager-image-box"

                style={{

                  width:

                    "110px",

                  height:

                    "110px",

                  margin:

                    "0 auto 14px",

                }}
>

                {parseProductImageSettings(

                  selectedProduct.image

                ).src ? (
<img

                    src={

                      parseProductImageSettings(

                        selectedProduct.image

                      ).src

                    }

                    alt={

                      selectedProduct.name

                    }

                    style={{

                      maxWidth:

                        "95px",

                      maxHeight:

                        "95px",

                    }}

                  />

                ) : (
<span>

                    ไม่มีรูป
</span>

                )}
</div>

<h2>

                {

                  selectedProduct.name

                }
</h2>

<div className="stock-old-value">

                ยอดในระบบ{" "}
<strong>

                  {

                    currentStock

                  }
</strong>
</div>

<label className="stock-label">

                ยอดที่นับได้จริง
</label>

<input

               <input

                ref={actualStockInputRef}

                className="manager-input"

                type="number"
 

                min="0"

                step="1"

                value={

                  actualStock

                }

                onChange={(

                  event

                ) =>

                  setActualStock(

                    event.target.value

                  )

                }

                onKeyDown={

                  handleKeyDown

                }

              />

<div

                style={{

                  marginTop:

                    "12px",

                  padding:

                    "12px",

                  borderRadius:

                    "10px",

                  background:

                    difference ===

                    0

                      ? "#f8fafc"

                      : difference >

                          0

                        ? "#ecfdf3"

                        : "#fef2f2",

                }}
>
<div

                  style={{

                    fontSize:

                      "12px",

                    color:

                      "#667085",

                  }}
>

                  ส่วนต่าง
</div>

<strong

                  style={{

                    display:

                      "block",

                    marginTop:

                      "4px",

                    fontSize:

                      "22px",

                  }}
>

                  {

                    getDifferenceText()

                  }
</strong>


                {validActualStock &&

                  difference !==

                    0 && (
<div

                      style={{

                        marginTop:

                          "4px",

                        fontSize:

                          "12px",

                      }}
>

                      {difference >

                      0

                        ? `ของจริงมากกว่าระบบ ${difference} ชิ้น`

                        : `ของจริงน้อยกว่าระบบ ${Math.abs(

                            difference

                          )} ชิ้น`}
</div>

                  )}
</div>

<label className="stock-label">

                เหตุผล
</label>

<select

                className="manager-input"

                value={

                  reason

                }

                onChange={(

                  event

                ) =>

                  setReason(

                    event.target.value

                  )

                }
>
<option value="ตรวจนับประจำสัปดาห์">

                  ตรวจนับประจำสัปดาห์
</option>
<option value="ของเสีย">

                  ของเสีย
</option>
<option value="สูญหาย">

                  สูญหาย
</option>
<option value="พบสินค้าเกิน">

                  พบสินค้าเกิน
</option>
<option value="แก้ไขยอดผิดพลาด">

                  แก้ไขยอดผิดพลาด
</option>
<option value="อื่นๆ">

                  อื่นๆ
</option>
</select>

<label className="stock-label">

                หมายเหตุ
</label>

<textarea

                className="manager-input"

                rows="3"

                placeholder="ไม่บังคับ"

                value={

                  note

                }

                onChange={(

                  event

                ) =>

                  setNote(

                    event.target.value

                  )

                }

              />

<div className="stock-new-value">

                หลังปรับ จะเหลือ{" "}
<strong>

                  {validActualStock

                    ? actualNumber

                    : "-"}
</strong>
</div>

<button

                className="stock-confirm-button"

                type="button"

                onClick={

                  confirmAdjustment

                }

                disabled={

                  !validActualStock ||

                  difference === 0

                }
>

                ยืนยันปรับสต๊อก
</button>
</>

          )}
</aside>
</div>
</div>

  );

}


export default StockAdjustment;
