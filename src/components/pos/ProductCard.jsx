import { useRef } from "react";


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


function getProductImageSettings(value) {

  const defaults = {

    src: "",

    scale: 1,

    x: 0,

    y: 0,

  };


  if (!value) return defaults;


  if (typeof value !== "string") {

    return defaults;

  }


  if (!value.trim().startsWith("{")) {

    return {

      ...defaults,

      src: value,

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

      src: value,

    };

  }

}


function ProductCard({

  index = 0,

  product,

  packEnabled,

  normalPrice,

  lowStock,

  onClick,

  onLongPressStart,

  onLongPressCancel,

}) {


  const imageSettings =

    getProductImageSettings(

      product.image

    );


  const movedRef = useRef(false);

  const startYRef = useRef(0);


  return (
<button

      type="button"

      className="product-card product-card-touch pos-image-card"

      style={{

        background: getProductTheme(index),

      }}


      onClick={(event)=>{

        if(movedRef.current){

          event.preventDefault();

          return;

        }


        onClick();

      }}


      onMouseDown={onLongPressStart}

      onMouseUp={onLongPressCancel}

      onMouseLeave={onLongPressCancel}


      onTouchStart={(event)=>{


        movedRef.current = false;


        startYRef.current =

          event.touches[0].clientY;


        onLongPressStart(event);


      }}


      onTouchMove={(event)=>{


        const distance =

          Math.abs(

            event.touches[0].clientY -

            startYRef.current

          );


        if(distance > 10){

          movedRef.current = true;

          onLongPressCancel();

        }


      }}


      onTouchEnd={(event)=>{


        if(!movedRef.current){

          onLongPressCancel();

        }


      }}


      onTouchCancel={onLongPressCancel}


      onContextMenu={(event)=>event.preventDefault()}
>

<div className="pos-card-image-area">


        {imageSettings.src ? (
<img

            className="pos-card-image"

            src={imageSettings.src}

            alt={product.name || "สินค้า"}

            decoding="async"


            style={{


              "--product-image-scale":

                imageSettings.scale,


              "--product-image-x":

                `${imageSettings.x}%`,


              "--product-image-y":

                `${imageSettings.y}%`,


            }}


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

<div

  className={

    lowStock

      ? "pos-card-name low-stock"

      : "pos-card-name"

  }
>

  {product.name}
</div>


<div

  className={

    lowStock

      ? "pos-card-price low-stock"

      : "pos-card-price"

  }
>


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
 
