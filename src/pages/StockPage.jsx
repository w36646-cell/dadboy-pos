import { useMemo, useState } from "react";

function StockPage({

  products,

  inventory,

  onAddStock,

  onClose,

}) {

  const [searchText, setSearchText] = useState("");

  const [selectedProduct, setSelectedProduct] =

    useState(null);

  const [receiveQty, setReceiveQty] = useState(1);

  const filteredProducts = useMemo(() => {

    const keyword = searchText.trim().toLowerCase();

    if (!keyword) {

      return products;

    }

    return products.filter((product) =>

      product.name.toLowerCase().includes(keyword)

    );

  }, [products, searchText]);

  function selectProduct(product) {

    setSelectedProduct(product);

    setReceiveQty(1);

  }

  function confirmReceive() {

    if (!selectedProduct) {

      return;

    }

    const quantity = Number(receiveQty);

    if (!Number.isFinite(quantity) || quantity <= 0) {

      window.alert("กรุณาใส่จำนวนที่รับเข้า");

      return;

    }

    onAddStock(selectedProduct.id, quantity);

    window.alert(

      `เพิ่มสต๊อก ${selectedProduct.name} จำนวน ${quantity} แล้ว`

    );

    setSelectedProduct(null);

    setReceiveQty(1);

  }

  return (
<div className="stock-page">
<div className="stock-page-header">
<div>
<h1>รับสินค้าเข้า</h1>
<p>เลือกสินค้าแล้วเพิ่มจำนวนสต๊อก</p>
</div>
<button

          className="stock-close-button"

          type="button"

          onClick={onClose}
>

          กลับหน้าขาย
</button>
</div>
<input

        className="search-input"

        type="search"

        placeholder="ค้นหาสินค้าที่จะรับเข้า..."

        value={searchText}

        onChange={(event) =>

          setSearchText(event.target.value)

        }

      />
<div className="stock-layout">
<div className="stock-product-grid">

          {filteredProducts.map((product) => {

            const stock = Number(

              inventory[product.id] ?? 50

            );

            return (
<button

                type="button"

                className={

                  selectedProduct?.id === product.id

                    ? "stock-product-card selected"

                    : "stock-product-card"

                }

                key={product.id}

                onClick={() => selectProduct(product)}
>
<div className="stock-product-image">

                  {product.image ? (
<img

                      src={product.image}

                      alt={product.name}

                      onError={(event) => {

                        event.currentTarget.style.display =

                          "none";

                      }}

                    />

                  ) : (
<span>ไม่มีรูป</span>

                  )}
</div>
<strong>{product.name}</strong>
<div

                  className={

                    stock < 0

                      ? "stock-current negative"

                      : "stock-current"

                  }
>

                  คงเหลือ {stock}
</div>
</button>

            );

          })}
</div>
<aside className="stock-form-panel">

          {!selectedProduct ? (
<div className="stock-form-empty">

              เลือกสินค้าทางด้านซ้าย
</div>

          ) : (
<>
<h2>{selectedProduct.name}</h2>
<div className="stock-old-value">

                สต๊อกปัจจุบัน{" "}
<strong>

                  {Number(

                    inventory[selectedProduct.id] ?? 50

                  )}
</strong>
</div>
<label className="stock-label">

                จำนวนที่รับเข้า
</label>
<div className="stock-qty-controls">
<button

                  type="button"

                  onClick={() =>

                    setReceiveQty((qty) =>

                      Math.max(1, Number(qty) - 1)

                    )

                  }
>

                  −
</button>
<input

                  type="number"

                  min="1"

                  value={receiveQty}

                  onChange={(event) =>

                    setReceiveQty(event.target.value)

                  }

                  autoFocus

                />
<button

                  type="button"

                  onClick={() =>

                    setReceiveQty((qty) =>

                      Number(qty || 0) + 1

                    )

                  }
>

                  +
</button>
</div>
<div className="stock-new-value">

                หลังรับเข้า จะเหลือ{" "}
<strong>

                  {Number(

                    inventory[selectedProduct.id] ?? 50

                  ) + (Number(receiveQty) || 0)}
</strong>
</div>
<button

                className="stock-confirm-button"

                type="button"

                onClick={confirmReceive}
>

                เพิ่มสต๊อก
</button>
</>

          )}
</aside>
</div>
</div>

  );

}

export default StockPage;
 