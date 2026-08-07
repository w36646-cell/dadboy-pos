function Sidebar({

  currentPage,

  ownerMode,

  onChangePage,

  onOwnerLogin,

  onOwnerLogout,

}) {

  return (
<div className="sidebar">
<div className="sidebar-header">
<strong>Dadboy POS</strong>
<span>

          {ownerMode

            ? "โหมดเจ้าของร้าน"

            : "โหมดพนักงาน"}
</span>
</div>
<div className="sidebar-menu">

        {currentPage !== "pos" && (
<button

            type="button"

            className="sidebar-button"

            onClick={() =>

              onChangePage("pos")

            }
>

            🛒 ขายสินค้า
</button>

        )}
<button

          type="button"

          className="sidebar-button"

          onClick={() =>

            onChangePage("stock")

          }
>

          📥 รับสินค้าเข้า
</button>

        {ownerMode ? (
<>
<button

              type="button"

              className="sidebar-button"

              onClick={() =>

                onChangePage("dashboard")

              }
>

              📊 Dashboard
</button>
<button

              type="button"

              className="sidebar-button"

              onClick={() =>

                onChangePage("products")

              }
>

              📦 จัดการสินค้า
</button>
<button

              type="button"

              className="sidebar-button"

              onClick={() =>

                onChangePage("reports")

              }
>

              📈 รายงาน
</button>
<button

              type="button"

              className="sidebar-button"

              onClick={() =>

                onChangePage("settings")

              }
>

              ⚙️ ตั้งค่า
</button>
<button

              type="button"

              className="sidebar-button"

              onClick={onOwnerLogout}
>

              🔓 ออกจากโหมดเจ้าของร้าน
</button>
</>

        ) : (
<button

            type="button"

            className="sidebar-button"

            onClick={onOwnerLogin}
>

            🔐 โหมดเจ้าของร้าน
</button>

        )}
</div>
</div>

  );

}

export default Sidebar;
 