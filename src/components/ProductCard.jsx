function ProductCard({

  product,

  stock,

  onClick,

  onAdd,

}) {

  if (!product) {

    return null;

  }

  const normalOption =

    product.options?.find(

      (option) => option.id === "normal"

    ) || product.options?.[0];

  const displayPrice =

    normalOption?.price ??

    product.price ??

    0;

  const displayStock =

    stock === undefined || stock === null

      ? product.stock ?? 50

      : stock;

  function handleClick() {

    if (typeof onClick === "function") {

      onClick(product);

      return;

    }

    if (typeof onAdd === "function") {

      onAdd(product);

    }

  }

  return (
<button

      type="button"

      className="product-card product-card-touch"

      onClick={handleClick}
>

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
<div className="product-image-placeholder">

          ไม่มีรูป
</div>

      )}
<div className="product-card-overlay">
<div className="product-name">

          {product.name}
</div>
<div className="product-price">

          {displayPrice} บาท
</div>
<div

          className={

            Number(displayStock) < 0

              ? "stock-text stock-negative"

              : "stock-text"

          }
>

          คงเหลือ {displayStock}
</div>
</div>
</button>

  );

}

export default ProductCard;
 