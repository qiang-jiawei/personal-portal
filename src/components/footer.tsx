import Link from "next/link";

export function Footer() {
  return (
    <footer className="border-t border-[#e5e5e5] dark:border-[#2a2a3a] bg-[#fafaf9] dark:bg-[#0f0f1a]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* About */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-3">
              关于本站
            </h3>
            <p className="text-xs text-[#6b7280] leading-relaxed">
              个人门户网站系统，提供信息公开、在线咨询、财务管理等综合服务。
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-3">
              快速链接
            </h3>
            <ul className="space-y-2">
              {[
                { label: "个人简介", href: "/profile" },
                { label: "通知公告", href: "/notices" },
                { label: "信息公开", href: "/disclosure" },
                { label: "服务大厅", href: "/service" },
              ].map((link) => (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    className="text-xs text-[#6b7280] hover:text-[#b8860b] transition-colors duration-200"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="font-serif text-sm font-semibold text-[#1a1a2e] dark:text-[#fafaf9] mb-3">
              联系方式
            </h3>
            <ul className="space-y-2 text-xs text-[#6b7280]">
              <li>工作时间：周一至周五 9:00-17:00</li>
              <li>
                <Link href="/feedback" className="hover:text-[#b8860b] transition-colors duration-200">
                  访客反馈
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="mt-8 pt-4 border-t border-[#e5e5e5] dark:border-[#2a2a3a] flex flex-col sm:flex-row items-center justify-between gap-2">
          <p className="text-[10px] text-[#6b7280]">
            Personal Portal System
          </p>
          <div id="visit-stats" className="text-[10px] text-[#6b7280]">
            {/* Visit stats will be loaded client-side */}
          </div>
        </div>
      </div>
    </footer>
  );
}
