function ProductCard({

  product,

  stock,

  lowStock,

  packEnabled,

  normalPrice,

  onClick,

  onLongPressStart,

  onLongPressCancel,

}) {

  return (
<button

      type="button"

      className="product-card product-card-touch"

      onClick={onClick}

      onMouseDown={onLongPressStart}

      onMouseUp={onLongPressCancel}

      onMouseLeave={onLongPressCancel}

      onTouchStart={onLongPressStart}

      onTouchEnd={onLongPressCancel}

      onTouchCancel={onLongPressCancel}

      onContextMenu={(event) =>

        event.preventDefault()

      }
>
<div className="product-image-box">

        {product.image ? (
<img

            className="product-image"

            src={product.image}

            alt={product.name || "สินค้า"}

            onError={(event) => {

              event.currentTarget.style.display =

                "none";

            }}

          />

        ) : (
<span>ไม่มีรูป</span>

        )}
</div>
<div className="product-name">

        {product.name}
</div>
<div className="product-price">

        {normalPrice} บาท
</div>

      {packEnabled && (
<div

          style={{

            marginTop: "4px",

            fontSize: "11px",

            color: "#667085",

          }}
>

          กดค้าง: แพ็ก {product.packQty} ชิ้น{" "}

          {Number(

            product.packPrice

          ).toLocaleString()}{" "}

          บาท
</div>

      )}
<div

        className={

          lowStock

            ? "stock-text stock-negative"

            : "stock-text"

        }
>

        คงเหลือ {stock}
</div>
</button>

  );

}

export default ProductCard;
 