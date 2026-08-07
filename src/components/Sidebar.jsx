function Sidebar({

  currentPage,

  ownerMode,

  onChangePage,

  onOwnerLogin,

  onOwnerLogout,

}) {

  return (
<aside className="sidebar">
<div className="sidebar-brand">
<div className="sidebar-logo">DB</div>
<div>
<strong>Dadboy POS</strong>
<span>

            {ownerMode

              ? "โหมดเจ้าของร้าน"

              : "โหมดพนักงาน"}
</span>
</div>
</div>
<nav className="sidebar-menu">
<button

          type="button"

          className={

            currentPage === "pos"

              ? "sidebar-item active"

              : "sidebar-item"

          }

          onClick={() => onChangePage("pos")}
>
<span className="sidebar-icon">🛒</span>
<span>ขายสินค้า</span>
</button>
<button

          type="button"

          className={

            currentPage === "stock"

              ? "sidebar-item active"

              : "sidebar-item"

          }

          onClick={() => onChangePage("stock")}
>
<span className="sidebar-icon">📥</span>
<span>รับสินค้าเข้า</span>
</button>

        {ownerMode && (
<>
<div className="sidebar-divider" />
<button

              type="button"

              className={

                currentPage === "dashboard"

                  ? "sidebar-item active"

                  : "sidebar-item"

              }

              onClick={() =>

                onChangePage("dashboard")

              }
>
<span className="sidebar-icon">📊</span>
<span>Dashboard</span>
</button>
<button

              type="button"

              className={

                currentPage === "products"

                  ? "sidebar-item active"

                  : "sidebar-item"

              }

              onClick={() =>

                onChangePage("products")

              }
>
<span className="sidebar-icon">📦</span>
<span>สินค้า</span>
</button>
<button

              type="button"

              className={

                currentPage === "reports"

                  ? "sidebar-item active"

                  : "sidebar-item"

              }

              onClick={() =>

                onChangePage("reports")

              }
>
<span className="sidebar-icon">🧾</span>
<span>รายงาน</span>
</button>
<button

              type="button"

              className={

                currentPage === "settings"

                  ? "sidebar-item active"

                  : "sidebar-item"

              }

              onClick={() =>

                onChangePage("settings")

              }
>
<span className="sidebar-icon">⚙️</span>
<span>ตั้งค่า</span>
</button>
</>

        )}
</nav>
<div className="sidebar-bottom">

        {ownerMode ? (
<button

            type="button"

            className="sidebar-owner-button logout"

            onClick={onOwnerLogout}
>
<span className="sidebar-icon">🚪</span>
<span>ออกจากโหมดเจ้าของ</span>
</button>

        ) : (
<button

            type="button"

            className="sidebar-owner-button"

            onClick={onOwnerLogin}
>
<span className="sidebar-icon">🔒</span>
<span>โหมดเจ้าของร้าน</span>
</button>

        )}
</div>
</aside>

  );

}

export default Sidebar;
 