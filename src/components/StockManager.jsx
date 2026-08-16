import {

  useMemo,

  useState,

} from "react";

function getProductImage(value) {

  if (!value) {

    return "";

  }

  if (

    typeof value !== "string" ||

    !value.trim().startsWith("{")

  ) {

    return String(value || "");

  }

  try {

    const parsed = JSON.parse(value);

    return String(

      parsed.src || ""

    );

  } catch {

    return String(value || "");

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

  /*

    มีแพ็กสำหรับการรับสินค้าเข้า

    เมื่อกำหนด packQty ตั้งแต่ 2 ขึ้นไป

    ไม่สนว่า packEnabled

    เปิดขายแพ็กอยู่หรือไม่

  */

  function hasPack(

    product

  ) {

    return (

      Math.max(

        1,

        Number(

          product?.packQty ??

            1

        ) || 1

      ) >= 2

    );

  }

  function getPackQty(

    product

  ) {

    return Math.max(

      1,

      Math.floor(

        Number(

          product?.packQty ??

            1

        ) || 1

      )

    );

  }

  function selectProduct(

    product

  ) {

    setSelectedProduct(

      product

    );

    setReceiveQty(1);

    /*

      ถ้าสินค้ามี packQty

      ให้เริ่มต้นเป็นแพ็กเลย

    */

    setReceiveUnit(

      hasPack(product)

        ? "pack"

        : "unit"

    );

  }

  function getReceivePieces() {

    const quantity =

      Number(

        receiveQty

      );

    if (

      !Number.isFinite(

        quantity

      ) ||

      quantity <= 0

    ) {

      return 0;

    }

    if (

      receiveUnit ===

        "pack" &&

      hasPack(

        selectedProduct

      )

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

    if (

      !selectedProduct

    ) {

      return;

    }

    const quantity =

      Number(

        receiveQty

      );

    if (

      !Number.isFinite(

        quantity

      ) ||

      quantity <= 0

    ) {

      window.alert(

        "กรุณาใส่จำนวนที่รับเข้า"

      );

      return;

    }

    const pieces =

      getReceivePieces();

    if (

      pieces <= 0

    ) {

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

      receiveUnit ===

        "pack" &&

      hasPack(

        selectedProduct

      )

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

    setSelectedProduct(

      null

    );

    setReceiveQty(1);

    setReceiveUnit(

      "unit"

    );

  }

  function handleKeyDown(

    event

  ) {

    if (

      event.key ===

      "Enter"

    ) {

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

            เลือกรับเป็นชิ้น

            หรือแพ็กได้
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
<input

        className="search-input"

        type="search"

        placeholder="ค้นหาสินค้าที่จะรับเข้า..."

        value={

          searchText

        }

        onChange={(

          event

        ) =>

          setSearchText(

            event.target

              .value

          )

        }

      />

<div className="stock-product-list">

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

      const imageSrc =

        getProductImage(

          product.image

        );

      return (
<button

          type="button"

          className={

            selectedProduct?.id ===
product.id

              ? "stock-list-item selected"

              : "stock-list-item"

          }

          key={product.id}

          onClick={() =>

            selectProduct(

              product

            )

          }
>
<div className="stock-list-image">

            {imageSrc ? (
<img

                src={imageSrc}

                alt={product.name}

              />

            ) : (
<span>

                ไม่มีรูป
</span>

            )}
</div>
<div className="stock-list-info">
<strong>

              {product.name}
</strong>
<span>

              คงเหลือ {stock} ชิ้น
</span>

            {hasPack(product) && (
<small>

                1 แพ็ก = {packQty} ชิ้น
</small>

            )}
</div>
<div className="stock-list-arrow">

            ›
</div>
</button>

      );

    }

  )}
</div>
  
<aside className="stock-form-panel">

          {!selectedProduct ? (
<div className="stock-form-empty">

              เลือกสินค้าทางด้านซ้าย
</div>

          ) : (
<>
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
</strong>{" "}

                    ชิ้น
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

  );

}

export default StockManager;
 
