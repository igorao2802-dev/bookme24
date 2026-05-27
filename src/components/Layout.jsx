export default function Layout({ title, children }) {
  return (
    <div className="layout">
      <header className="layout__header">
        <h1>{title}</h1>
        <p className="layout__subtitle">Профессиональный уход за вашей красотой</p>
      </header>
      <main className="layout__main">
        {/* ПОЧЕМУ children? Это механизм композиции React. 
            Layout задаёт единый каркас (шапку, подвал, отступы), 
            а контент вкладывается динамически. Это исключает дублирование 
            разметки на каждой странице и упрощает поддержку темы. */}
        {children}
      </main>
      <footer className="layout__footer">
        <p>© 2026 Салон «Здоровье и красота». Все права защищены.</p>
        <p>Система онлайн-записи. Версия 1.0</p>
      </footer>
    </div>
    );
}