import {

  useState,

} from "react";

import "./OwnerSidebar.css";

function OwnerSidebar({

  currentPage,

  onChangePage,

  onLogout,

}) {

  const [

    mobileOpen,

    setMobileOpen,

  ] = useState(false);

  const menuItems = [

    {

      id: "dashboard",

      icon: "📊",

      label: "Dashboard",

    },

    {

      id: "pos",

      icon: "🛒",

      label: "ขายสินค้า",

    },

    {

      id: "products",

      icon: "📦",

      label: "จัดการสินค้า",

    },

    {

      id: "stock",

      icon: "📥",

      label: "รับสินค้าเข้า",

    },

    {

      id: "stock-adjustment",

      icon: "🧮",

      label: "ปรับสต๊อก",

    },

    {

      id: "reports",

      icon: "📈",

      label: "รายงาน",

    },

    {

      id: "bills",

      icon: "🧾",

      label: "บิลย้อนหลัง",

    },

  ];

  function selectPage(

    page

  ) {

    onChangePage(

      page

    );

    setMobileOpen(

      false

    );

  }

  function logout() {

    setMobileOpen(

      false

    );

    onLogout();

  }

  return (
<>
<button

        type="button"

        className="owner-mobile-menu-button"

        onClick={() =>

          setMobileOpen(

            (current) =>

              !current

          )

        }

        aria-label="เปิดเมนูเจ้าของร้าน"
>

        ☰
</button>

      {mobileOpen && (
<div

          className="owner-sidebar-backdrop"

          onClick={() =>

            setMobileOpen(

              false

            )

          }

        />

      )}
<aside

        className={

          mobileOpen

            ? "owner-sidebar mobile-open"

            : "owner-sidebar"

        }
>
<div className="owner-sidebar-header">
<div>
<strong>

              Dadboy POS
</strong>
<span>

              โหมดเจ้าของร้าน
</span>
</div>
<button

            type="button"

            className="owner-sidebar-close"

            onClick={() =>

              setMobileOpen(

                false

              )

            }

            aria-label="ปิดเมนู"
>

            ×
</button>
</div>
<nav className="owner-sidebar-menu">

          {menuItems.map(

            (item) => (
<button

                type="button"

                key={
item.id

                }

                className={

                  currentPage ===
item.id

                    ? "owner-sidebar-item active"

                    : "owner-sidebar-item"

                }

                onClick={() =>

                  selectPage(
item.id

                  )

                }
>
<span className="owner-sidebar-icon">

                  {

                    item.icon

                  }
</span>
<span>

                  {

                    item.label

                  }
</span>
</button>

            )

          )}
</nav>
<div className="owner-sidebar-bottom">
<button

            type="button"

            className="owner-sidebar-logout"

            onClick={

              logout

            }
>
<span>

              🚪
</span>
<span>

              ออกจากโหมดเจ้าของ
</span>
</button>
</div>
</aside>
</>

  );

}

export default OwnerSidebar;
 