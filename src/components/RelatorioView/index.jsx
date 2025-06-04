import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

/* eslint-disable react/prop-types */
export default function RelatorioView({
  styles,
  dados,
  nomeFiltro,
  setNomeFiltro,
  dataInicio,
  setDataInicio,
  dataFim,
  setDataFim,
  filtroTicket,
  setFiltroTicket,
}) {
  const dadosCorrigidos = dados.map(item => {
  const matricula = String(item.Matricula);
  const matriculaCorrigida =
    matricula.length === 5
      ? matricula.slice(0, 4) + '.' + matricula.slice(4)
      : item.Matricula;

    return {
        ...item,
        Matricula: matriculaCorrigida,
    };
    });


  // Agrupa por nome e coleta os dados do primeiro registro + contagem de presenças
  const mapaAlunos = {};

  dadosCorrigidos.forEach((item) => {
    const nome = item["Nome"];
    const dataItem = item.Data;

    const dentroData =
      (!dataInicio || dataItem >= dataInicio) &&
      (!dataFim || dataItem <= dataFim);

    const nomeOk =
      !nomeFiltro ||
      nome.toLowerCase().includes(nomeFiltro.toLowerCase());

    const ticketOk =
      filtroTicket === "Todos" ||
      (filtroTicket === "Apenas Ticket" &&
        item.Ticket === "TRUE") ||
      (filtroTicket === "Nenhum Ticket" &&
        item.Ticket === "FALSE");

    if (dentroData && nomeOk && ticketOk) {
      if (!mapaAlunos[nome]) {
        mapaAlunos[nome] = {
          nome: item.Nome,
          presencas: 0,
          ticket: item.Ticket,
          ies: item.IES,
          curso: item.Curso,
          turno: item.Turno,
          matricula: item.Matricula,
          email: item.Email,
        };
      }
      mapaAlunos[nome].presencas += 1;
    }
  });

  const lista = Object.values(mapaAlunos).sort((a, b) => b.presencas - a.presencas);

  const baixarXLSX = () => {
  const dadosExcel = lista.map((item) => ({
    Nome: item.nome,
    Presenças: item.presencas,
    Ticket: item.ticket,
    IES: item.ies,
    Curso: item.curso,
    Turno: item.turno,
    Email: item.email,
    Matrícula: item.matricula,
  }));

  const ws = XLSX.utils.json_to_sheet(dadosExcel);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Relatório");

  const excelBuffer = XLSX.write(wb, {
    bookType: "xlsx",
    type: "array",
  });

  const blob = new Blob([excelBuffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(blob, "relatorio_presencas.xlsx");
};

  return (
    <>
      <div>
        <h3>Relatório de Presenças</h3>

        <input
          type="text"
          placeholder="Buscar por nome..."
          value={nomeFiltro}
          onChange={(e) => setNomeFiltro(e.target.value)}
          style={styles.inputBusca}
        />

        <input
          type="date"
          value={dataInicio}
          onChange={(e) => setDataInicio(e.target.value)}
          style={styles.inputData}
        />

        <input
          type="date"
          value={dataFim}
          onChange={(e) => setDataFim(e.target.value)}
          style={styles.inputData}
        />

        <select
          value={filtroTicket}
          onChange={(e) => setFiltroTicket(e.target.value)}
          style={styles.select}
        >
          <option value="Todos">Todos</option>
          <option value="Apenas Ticket">Apenas Ticket</option>
          <option value="Nenhum Ticket">Nenhum Ticket</option>
        </select>

        <button onClick={baixarXLSX} style={{ marginLeft: "1rem", padding: "6px 12px", borderRadius: "6px", backgroundColor: "#4caf50", color: "white" }}>
            Baixar Excel
        </button>

      </div>

      <div style={styles.listContainer}>
        {dados.length === 0 ? (
          <p>Carregando dados...</p>
        ) : (
          <table className="min-w-full bg-white border rounded-xl shadow" style={{ marginTop: "1rem" }}>
            <thead>
              <tr className="bg-gray-200 text-gray-700 text-left text-sm">
                <th className="py-2 px-4">Nome</th>
                <th className="py-2 px-4">Presenças</th>
                <th className="py-2 px-4">Ticket</th>
                <th className="py-2 px-4">IES</th>
                <th className="py-2 px-4">Curso</th>
                <th className="py-2 px-4">Turno</th>
                <th className="py-2 px-4">Matrícula</th>
                <th className="py-2 px-4">E-mail</th>
              </tr>
            </thead>
            <tbody>
              {lista.map((aluno, index) => (
                <tr key={index} className="border-t hover:bg-gray-50">
                  <td className="py-2 px-4">{aluno.nome}</td>
                  <td className="py-2 px-4">{aluno.presencas}</td>
                  <td className="py-2 px-4">{aluno.ticket}</td>
                  <td className="py-2 px-4">{aluno.ies}</td>
                  <td className="py-2 px-4">{aluno.curso}</td>
                  <td className="py-2 px-4">{aluno.turno}</td>
                  <td className="py-2 px-4">{aluno.matricula}</td>
                  <td className="py-2 px-4">{aluno.email}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
