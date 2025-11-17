/**
 * @page HomePage
 * @summary Home page displaying welcome message and system overview
 * @domain core
 * @type landing-page
 * @category public
 */
export const HomePage = () => {
  return (
    <div className="text-center">
      <h2 className="text-3xl font-bold text-gray-900 mb-4">Bem-vindo ao StockBox</h2>
      <p className="text-lg text-gray-600 mb-8">
        Sistema para controlar itens no estoque: entradas, saídas e quantidade atual
      </p>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📦</div>
          <h3 className="text-xl font-semibold mb-2">Produtos</h3>
          <p className="text-gray-600">Gerencie seu catálogo de produtos</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📊</div>
          <h3 className="text-xl font-semibold mb-2">Movimentações</h3>
          <p className="text-gray-600">Registre entradas e saídas</p>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="text-4xl mb-4">📈</div>
          <h3 className="text-xl font-semibold mb-2">Relatórios</h3>
          <p className="text-gray-600">Acompanhe seu estoque</p>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
