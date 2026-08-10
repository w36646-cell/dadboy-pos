function getProductTheme(

  index

) {

  const themes = [

    "linear-gradient(160deg, #4f91dc 0%, #063064 100%)",

    "linear-gradient(160deg, #ef6f68 0%, #74110f 100%)",

    "linear-gradient(160deg, #4fc56e 0%, #07572a 100%)",

    "linear-gradient(160deg, #ffad22 0%, #8d4300 100%)",

    "linear-gradient(160deg, #70cdf7 0%, #13506e 100%)",

    "linear-gradient(160deg, #ffd54a 0%, #9d5c00 100%)",

    "linear-gradient(160deg, #b6df35 0%, #407400 100%)",

    "linear-gradient(160deg, #234d79 0%, #03192f 100%)",

  ];

  return themes[

    index %

      themes.length

  ];

}

function ProductCard({

  index = 0,

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

      className="product-card product-card-touch pos-image-card"

      style={{

        background:

          getProductTheme(

            index

          ),

      }}

      onClick={

        onClick

      }

      onMouseDown={

        onLongPressStart

      }

      onMouseUp={

        onLongPressCancel

      }

      onMouseLeave={

        onLongPressCancel

      }

      onTouchStart={

        onLongPressStart

      }

      onTouchEnd={

        onLongPressCancel

      }

      onTouchCancel={

        onLongPressCancel

      }

      onContextMenu={(

        event

      ) =>

        event.preventDefault()

      }
>
<div className="pos-card-image-area">

        {product.image ? (
<img

            className="pos-card-image"

            src={

              product.image

            }

            alt={

              product.name ||

              "สินค้า"

            }

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

          {

            product.name

          }
</div>
<div className="pos-card-price">

          {Number(

            normalPrice || 0

          ).toLocaleString()}{" "}

          บาท
</div>
<div

          className={

            lowStock

              ? "pos-card-stock low"

              : "pos-card-stock"

          }
>

          คงเหลือ{" "}

          {stock}
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
 