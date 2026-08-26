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

    const parsed = JSON.parse(value);

    return {

      src: String(parsed.src || ""),

      scale: Number(parsed.scale || 1),

      x: Number(parsed.x || 0),

      y: Number(parsed.y || 0),

    };

  } catch {

    return {

      ...defaults,

      src: String(value || ""),

    };

  }

}


function StockManager({

  products,

  inventory,

  onAddStock,

  onClose,

}) {

  const [

    searchText,

    setSearchText,

  ] = useState("");

 const searchInputRef = useRef(null);

  const stockTableScrollRef =

    useRef(null);

  const stockStickyScrollRef =

    useRef(null);


  function syncFromStockTable(

    event

  ) {

    const sticky =

      stockStickyScrollRef.current;

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


  function syncFromStockStickyHeader(

    event

  ) {

    const table =

      stockTableScrollRef.current;

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

    receiveQty,

    setReceiveQty,

  ] = useState(1);

  const [

    receiveUnit,

    setReceiveUnit,

  ] = useState("unit");


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


  function hasPack(product) {

    return (

      Math.max(

        1,

        Number(

          product?.packQty ?? 1

        ) || 1

      ) >= 2

    );

  }


  function getPackQty(product) {

    return Math.max(

      1,

      Math.floor(

        Number(

          product?.packQty ?? 1

        ) || 1

      )

    );

  }


  function selectProduct(product) {

    setSelectedProduct(product);

    setReceiveQty(1);

    setReceiveUnit(

      hasPack(product)

        ? "pack"

        : "unit"

    );

  }


  function getReceivePieces() {

    const quantity =

      Number(receiveQty);

    if (

      !Number.isFinite(quantity) ||

      quantity <= 0

    ) {

      return 0;

    }

    if (

      receiveUnit === "pack" &&

      hasPack(selectedProduct)

    ) {

      return (

        quantity *

        getPackQty(

          selectedProduct

        )

      );

    }

    return quantity;

  }


  function confirmReceive() {

    if (!selectedProduct) {

      return;

    }

    const quantity =

      Number(receiveQty);

    if (

      !Number.isFinite(quantity) ||

      quantity <= 0

    ) {

      window.alert(

        "กรุณาใส่จำนวนที่รับเข้า"

      );

      return;

    }

    const pieces =

      getReceivePieces();

    if (pieces <= 0) {

      window.alert(

        "จำนวนรับเข้าไม่ถูกต้อง"

      );

      return;

    }

    onAddStock(
selectedProduct.id,

      pieces

    );

    if (

      receiveUnit === "pack" &&

      hasPack(selectedProduct)

    ) {

      window.alert(

        `รับสินค้าเข้าเรียบร้อย\n${selectedProduct.name}\n${quantity} แพ็ก × ${getPackQty(

          selectedProduct

        )} ชิ้น = ${pieces} ชิ้น`

      );

    } else {

      window.alert(

        `รับสินค้าเข้าเรียบร้อย\n${selectedProduct.name}\n${pieces} ชิ้น`

      );

    }

    setReceiveQty(1);

    setReceiveUnit("unit");

  }


  function handleKeyDown(event) {

    if (event.key === "Enter") {

      event.preventDefault();

      confirmReceive();

    }

  }


  const currentStock =

    selectedProduct

      ? Number(

          inventory[
selectedProduct.id

          ] ?? 0

        )

      : 0;


  const receivePieces =

    selectedProduct

      ? getReceivePieces()

      : 0;


  const newStock =

    currentStock +

    receivePieces;


  const selectedHasPack =

    hasPack(

      selectedProduct

    );


  const selectedPackQty =

    getPackQty(

      selectedProduct

    );


  return (
<div className="stock-page">
<div className="stock-page-header">
<div>
<h1>

            รับสินค้าเข้า
</h1>
<p>

            เลือกรับเป็นชิ้น หรือแพ็กได้
</p>
</div>
<button

          className="stock-close-button"

          type="button"

          onClick={onClose}
>

          กลับหน้าขาย
</button>
</div>

<div

  style={{

    position: "relative",

    width: "100%",

  }}
>
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

  placeholder="ค้นหาสินค้าที่จะรับเข้า..."

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

  ref={stockStickyScrollRef}

  onScroll={syncFromStockStickyHeader}
>
<table className="product-table">
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

  บรรจุ / แพ็ก
</th>
</tr>
</thead>
</table>
</div>

<div

  className="product-table-wrap"

  ref={stockTableScrollRef}

  onScroll={syncFromStockTable}
>
<table className="product-table">
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

                  const packQty =

                    getPackQty(

                      product

                    );

                  const imageSettings =

                    parseProductImageSettings(

                      product.image

                    );

                  const selected =

                    selectedProduct?.id ===
product.id;

                  return (
<tr

  key={
product.id

  }

  data-product-id={product.id}

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

                            stock <=

                            Number(

                              product.minStock ??

                                5

                            )

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

  className="stock-form-panel"

  style={{

    position: "relative",

  }}
>
 
          {selectedProduct && (
<button

    type="button"

    aria-label="ปิดรายการรับสินค้า"

    onClick={() => {

  const currentId = selectedProduct?.id;

  setSelectedProduct(null);

  setReceiveQty(1);

  setReceiveUnit("unit");

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

              เลือกสินค้าจากรายการด้านซ้าย
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

                สต๊อกปัจจุบัน{" "}
<strong>

                  {

                    currentStock

                  }
</strong>
</div>


              {selectedHasPack && (
<>
<label className="stock-label">

                    รับเข้าเป็น
</label>

<div

                    style={{

                      display:

                        "grid",

                      gridTemplateColumns:

                        "1fr 1fr",

                      gap:

                        "8px",

                      marginTop:

                        "8px",

                      marginBottom:

                        "12px",

                    }}
>
<button

                      type="button"

                      onClick={() =>

                        setReceiveUnit(

                          "pack"

                        )

                      }

                      style={{

                        padding:

                          "12px",

                        borderRadius:

                          "8px",

                        border:

                          receiveUnit ===

                          "pack"

                            ? "2px solid #1976d2"

                            : "1px solid #d0d5dd",

                        background:

                          receiveUnit ===

                          "pack"

                            ? "#e3f2fd"

                            : "#ffffff",

                        fontWeight:

                          "700",

                      }}
>

                      แพ็ก
</button>

<button

                      type="button"

                      onClick={() =>

                        setReceiveUnit(

                          "unit"

                        )

                      }

                      style={{

                        padding:

                          "12px",

                        borderRadius:

                          "8px",

                        border:

                          receiveUnit ===

                          "unit"

                            ? "2px solid #1976d2"

                            : "1px solid #d0d5dd",

                        background:

                          receiveUnit ===

                          "unit"

                            ? "#e3f2fd"

                            : "#ffffff",

                        fontWeight:

                          "700",

                      }}
>

                      ชิ้น / ขวด
</button>
</div>
</>

              )}


              {selectedHasPack &&

                receiveUnit ===

                  "pack" && (
<div

                    style={{

                      padding:

                        "10px",

                      marginBottom:

                        "12px",

                      borderRadius:

                        "8px",

                      background:

                        "#f8fafc",

                      color:

                        "#475467",

                    }}
>

                    1 แพ็ก ={" "}
<strong>

                      {

                        selectedPackQty

                      }
</strong>

                    {" "}ชิ้น
</div>

                )}

<label className="stock-label">

                {selectedHasPack &&

                receiveUnit ===

                  "pack"

                  ? "จำนวนแพ็ก"

                  : "จำนวนชิ้น / ขวด"}
</label>

<div className="stock-qty-controls">
<button

                  type="button"

                  onClick={() =>

                    setReceiveQty(

                      (qty) =>

                        Math.max(

                          1,

                          Number(

                            qty

                          ) - 1

                        )

                    )

                  }
>

                  −
</button>

<input

                  type="number"

                  min="1"

                  value={

                    receiveQty

                  }

                  onChange={(

                    event

                  ) =>

                    setReceiveQty(

                      event.target

                        .value

                    )

                  }

                  onKeyDown={

                    handleKeyDown

                  }

                  autoFocus

                />

<button

                  type="button"

                  onClick={() =>

                    setReceiveQty(

                      (qty) =>

                        Number(

                          qty || 0

                        ) + 1

                    )

                  }
>

                  +
</button>
</div>


              {selectedHasPack &&

                receiveUnit ===

                  "pack" && (
<div

                    style={{

                      padding:

                        "10px",

                      marginTop:

                        "12px",

                      borderRadius:

                        "8px",

                      background:

                        "#fff7ed",

                      color:

                        "#9a3412",

                      fontWeight:

                        "700",

                    }}
>

                    {Number(

                      receiveQty

                    ) || 0}{" "}

                    แพ็ก ×{" "}

                    {

                      selectedPackQty

                    }{" "}

                    ={" "}

                    {

                      receivePieces

                    }{" "}

                    ชิ้น
</div>

                )}

<div className="stock-new-value">

                หลังรับเข้า จะเหลือ{" "}
<strong>

                  {

                    newStock

                  }
</strong>
</div>

<button

                className="stock-confirm-button"

                type="button"

                onClick={

                  confirmReceive

                }
>

                เพิ่มสต๊อก
</button>

<div

                style={{

                  marginTop:

                    "8px",

                  textAlign:

                    "center",

                  color:

                    "#667085",

                  fontSize:

                    "12px",

                }}
>

                กด Enter เพื่อรับสินค้าเข้า
</div>
</>

          )}
</aside>
</div>
</div>
</div>

  );

}


export default StockManager;
 
