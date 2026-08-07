function PaymentPopup({

  open,

  total,

  onConfirm,

  onClose,

}) {

  if (!open) {

    return null;

  }

  return (
<div

      className="payment-overlay"

      onClick={onClose}
>
<div

        className="payment-popup"

        onClick={(event) =>

          event.stopPropagation()

        }
>
<div className="payment-title">

          ยืนยันการชำระเงิน
</div>
<div className="payment-total-label">

          ยอดชำระ
</div>
<div className="payment-total">

          {Number(total || 0).toLocaleString()} บาท
</div>
<button

          type="button"

          className="payment-confirm-button"

          onClick={onConfirm}
>

          ยืนยันการชำระเงิน
</button>
<button

          type="button"

          className="payment-cancel-button"

          onClick={onClose}
>

          ยกเลิก
</button>
</div>
</div>

  );

}

export default PaymentPopup;
 