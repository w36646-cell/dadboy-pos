function ProductOptionPopup({

  product,

  selectedOption,

  quantity,

  specialMode = "normal",

  onSelectOption,

  onChangeQuantity,

  onChangeSpecialMode,

  onConfirm,

  onClose,

}) {

  if (!product || !selectedOption) {

    return null;

  }

  const safeQuantity = Math.max(

    1,

    Number(quantity) || 1

  );

  /*

    สินค้าที่ไม่มี options

    แต่เปิด Popup จากการกดค้าง

    ให้ใช้ selectedOption เป็นตัวเลือก "ชิ้น"

  */

  const displayOptions =

    product.options?.length

      ? product.options

      : [selectedOption];

  const isSelfUse =

    specialMode === "selfUse";

  const total =

    Number(selectedOption.price || 0) *

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

  function handleQuantityChange(event) {

    onChangeQuantity(

      Math.max(

        1,

        Number(event.target.value) || 1

      )

    );

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
<div className="option-list">

          {displayOptions.map(

            (option) => (
<label

                className={
selectedOption.id ===
option.id

                    ? "option-button selected-option"

                    : "option-button"

                }

                key={option.id}
>
<span>
<input

                    type="radio"

                    name="product-option"

                    checked={
selectedOption.id ===
option.id

                    }

                    onChange={() =>

                      onSelectOption({

                        ...option,

                        saleType: "unit",

                        stockPerUnit: 1,

                      })

                    }

                  />{" "}

                  {option.name}
</span>
<strong>

                  {Number(

                    option.price || 0

                  ).toLocaleString()}{" "}

                  บาท
</strong>
</label>

            )

          )}
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

            : "เพิ่มลงตะกร้า"}
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

export default ProductOptionPopup;
 
