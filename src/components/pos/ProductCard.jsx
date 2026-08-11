function getProductTheme(index) {

  const themes = [

    "linear-gradient(155deg, #dbeafe 0%, #1d4ed8 100%)",

    "linear-gradient(155deg, #fee2e2 0%, #b91c1c 100%)",

    "linear-gradient(155deg, #dcfce7 0%, #15803d 100%)",

    "linear-gradient(155deg, #ffedd5 0%, #c2410c 100%)",

    "linear-gradient(155deg, #e0f2fe 0%, #0369a1 100%)",

    "linear-gradient(155deg, #fef3c7 0%, #a16207 100%)",

    "linear-gradient(155deg, #ecfccb 0%, #4d7c0f 100%)",

    "linear-gradient(155deg, #e2e8f0 0%, #334155 100%)",

  ];

  return themes[index % themes.length];

}

function ProductCard({

  index = 0,

  product,

  packEnabled,

  normalPrice,

  onClick,

  onLongPressStart,

  onLongPressCancel,

}) {

  return (
<button

      type="button"

      className="product-card product-card-touch pos-image-card"

      style={{

        background: getProductTheme(index),

      }}

      onClick={onClick}

      onMouseDown={onLongPressStart}

      onMouseUp={onLongPressCancel}

      onMouseLeave={onLongPressCancel}

      onTouchStart={onLongPressStart}

      onTouchEnd={onLongPressCancel}

      onTouchCancel={onLongPressCancel}

      onContextMenu={(event) => event.preventDefault()}
>
<div className="pos-card-image-area">

        {product.image ? (
<img

            className="pos-card-image"

            src={product.image}

            alt={product.name || "สินค้า"}

            decoding="async"

          />

        ) : (
<div className="pos-card-no-image">

            ไม่มีรูป
</div>

        )}
</div>
<div className="pos-card-shade" />

      {packEnabled && (
<div className="pos-pack-badge">

          PACK
</div>

      )}
<div className="pos-card-info">
<div className="pos-card-name">

          {product.name}
</div>
<div className="pos-card-price">

          {Number(normalPrice || 0).toLocaleString()} บาท
</div>

        {packEnabled && (
<div className="pos-card-pack-text">

            กดค้างเพื่อขายแพ็ก
</div>

        )}
</div>
</button>

  );

}

export default ProductCard;

