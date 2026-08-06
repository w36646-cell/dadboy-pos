function ProductCard({ product, onClick }) {

  return (

    <div className="product-card">

      <div className="product-image">

        {product.image ? (

          <img
            src={product.image}
            alt={product.name}
          />

        ) : (

          <div className="no-image">

            ไม่มีรูป

          </div>

        )}

      </div>

      <div className="product-name">

        {product.name}

      </div>

      <div className="product-price">

        {product.hasOption
          ? product.options[0].price
          : product.price
        } บาท

      </div>

      <div className="product-stock">

        คงเหลือ {product.stock}

      </div>

      <button
        className="add-btn"
        onClick={onClick}
      >

        เพิ่ม

      </button>

    </div>

  );

}

export default ProductCard;