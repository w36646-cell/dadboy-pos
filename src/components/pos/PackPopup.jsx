function PackPopup({

  product,

  quantity,

  stockUse,

  specialMode = "normal",

  onChangeQuantity,

  onChangeSpecialMode,

  onConfirm,

  onClose,

}) {

  if (!product) {

    return null;

  }

  const packQty = Math.max(

    2,

    Number(product.packQty) || 2

  );

  const packPrice = Math.max(

    0,

    Number(product.packPrice) || 0

  );

  const safeQuantity = Math.max(

    1,

    Number(quantity) || 1

  );

  const isSelfUse =

    specialMode === "selfUse";

  const total =

    packPrice *

    safeQuantity;

  const payableTotal =

    isSelfUse ? 0 : total;

  function decreaseQuantity() {

    onChangeQuantity(

      Math.max(

        1,

        safeQuantity - 1

      )

    );

  }

  function increaseQuantity() {

    onChangeQuantity(

      safeQuantity + 1

    );

  }

  function handleQuantityChange(

    event

  ) {

    const nextValue = Math.max(

      1,

      Number(event.target.value) || 1

    );

    onChangeQuantity(nextValue);

  }

  return (
<div

      className="popup-overlay"

      onClick={onClose}
>
<div

        className="popup"

        onClick={(event) =>

          event.stopPropagation()

        }
>
<h2>{product.name}</h2>
<div

          style={{

            marginBottom: "14px",

            padding: "12px",

            borderRadius: "10px",

            background: "#f8fafc",

            border:

              "1px solid #e4e7ec",

          }}
>
<div

            style={{

              fontSize: "13px",

              color: "#667085",

              marginBottom: "4px",

            }}
>

            ขายยกแพ็ก
</div>
<strong>

            1 แพ็ก = {packQty} ชิ้น
</strong>
<div

            style={{

              marginTop: "5px",

              fontSize: "14px",

            }}
>

            ราคา{" "}

            {packPrice.toLocaleString()}{" "}

            บาท / แพ็ก
</div>
</div>
<div className="popup-quantity">
<button

            type="button"

            onClick={decreaseQuantity}
>

            −
</button>
<input

            className="quantity-input"

            type="number"

            min="1"

            value={safeQuantity}

            onChange={

              handleQuantityChange

            }

          />
<button

            type="button"

            onClick={increaseQuantity}
>

            +
</button>
</div>
<div

          style={{

            marginTop: "12px",

            padding: "10px",

            borderRadius: "8px",

            background: "#fff7ed",

            color: "#9a3412",

            fontSize: "13px",

            fontWeight: "700",

          }}
>

          ใช้สต๊อก {stockUse} ชิ้น
</div>
<div

          style={{

            marginTop: "14px",

            padding: "12px",

            borderRadius: "10px",

            border:

              "1px solid #e4e7ec",

            background: isSelfUse

              ? "#fff7ed"

              : "#f8fafc",

          }}
>
<label

            style={{

              display: "flex",

              alignItems: "center",

              gap: "9px",

              cursor: "pointer",

              fontWeight: "700",

            }}
>
<input

              type="checkbox"

              checked={isSelfUse}

              onChange={(event) =>

                onChangeSpecialMode(

                  event.target.checked

                    ? "selfUse"

                    : "normal"

                )

              }

            />

            กินเอง
</label>

          {isSelfUse && (
<div

              style={{

                marginTop: "6px",

                fontSize: "12px",

                color: "#9a3412",

              }}
>

              ตัดสต๊อก แต่ไม่คิดเป็นยอดขาย
</div>

          )}
</div>
<div className="popup-total">

          {isSelfUse

            ? "ยอดขาย"

            : "รวม"}{" "}

          {payableTotal.toLocaleString()}{" "}

          บาท
</div>
<button

          className="pay-button"

          type="button"

          onClick={onConfirm}
>

          {isSelfUse

            ? "ยืนยันกินเอง"

            : "เพิ่มแพ็กลงตะกร้า"}
</button>
<button

          className="cancel-button"

          type="button"

          onClick={onClose}
>

          ยกเลิก
</button>
</div>
</div>

  );

}

export default PackPopup;
 
