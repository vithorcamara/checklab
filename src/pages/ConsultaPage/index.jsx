import { useEffect, useState } from "react";
import axios from "axios";

export default function ConsultaRestrita() {
  const [cpf, setCpf] = useState("");
  const [mes, setMes] = useState("");
  const [ano, setAno] = useState("");
  const [dados, setDados] = useState([]);
  const [resultados, setResultados] = useState([]);
  const [buscaExecutada, setBuscaExecutada] = useState(false);

  // Calcula data de início (1º do mês) e fim (último dia do mês) com base em mes e ano
  const getDataInicio = () => {
    if (!mes || !ano) return "";
    return `${ano}-${mes}-01`; // yyyy-mm-dd
  };

  const getDataFim = () => {
    if (!mes || !ano) return "";
    const ultimoDia = new Date(ano, parseInt(mes), 0).getDate();
    return `${ano}-${mes}-${String(ultimoDia).padStart(2, "0")}`;
  };

  const dataInicio = getDataInicio();
  const dataFim = getDataFim();

  // Carrega dados da API uma vez
  useEffect(() => {
    const buscarPresencas = async () => {
      try {
        const response = await axios.get("https://check-api-qpu9.onrender.com/resumo");
        console.log("Dados recebidos:", response.data);
        setDados(response.data);
      } catch (error) {
        console.error("Erro ao buscar dados de presença:", error);
      }
    };
    buscarPresencas();
  }, []);

  // Função que calcula o semestre atual com base no mês
  function semestreAtualPeloMes(mes) {
    const mesNum = parseInt(mes, 10);
    return mesNum >= 7 ? 2 : 1;
  }

  // Função que calcula o período e retorna "Egresso" se maior que 5
  function calcularPeriodoEGresso(matricula, anoAtual, semestreAtual) {
    const matriculaStr = String(matricula);
    if (matriculaStr.length < 5) return { periodoStr: matriculaStr, egresso: false };

    const anoMat = parseInt(matriculaStr.slice(0, 4), 10);
    const semestreMat = parseInt(matriculaStr.slice(4, 5), 10);

    const periodo = (anoAtual - anoMat) * 2 + (semestreAtual - semestreMat) + 2;

    if (periodo > 5) {
      return { periodoStr: "Egresso", egresso: true };
    } else {
      return { periodoStr: String(periodo), egresso: false };
    }
  }

  // Filtra dados ao clicar no botão Buscar
  function buscaButton() {
    if (!cpf || !mes || !ano) {
      alert("Por favor, preencha todos os campos.");
      return;
    }

    const cpfNormalizado = cpf.replace(/\D/g, "");

    const filtrado = dados.filter((item) => {
      const cpfItem = String(item["CPF"] || "").replace(/\D/g, "");
      const dataItem = item["Data"];

      if (!cpfItem || !dataItem) return false;

      // Formatar a data do item para padrão yyyy-mm-dd para comparação
      let dataFormatada = "";

      if (dataItem.includes("-")) {
        const partes = dataItem.split("-");
        if (partes[0].length === 4) {
          dataFormatada = dataItem;
        } else if (partes[2].length === 4) {
          dataFormatada = `${partes[2]}-${partes[0]}-${partes[1]}`;
        }
      } else if (dataItem.includes("/")) {
        const partes = dataItem.split("/");
        dataFormatada = `${partes[2]}-${partes[1]}-${partes[0]}`;
      } else {
        return false;
      }

      return (
        cpfItem === cpfNormalizado &&
        dataFormatada >= dataInicio &&
        dataFormatada <= dataFim
      );
    });

    setResultados(filtrado);
    setBuscaExecutada(true);
  }

  // Pega o primeiro resultado para exibir as infos do aluno
  const aluno = resultados.length > 0 ? resultados[0] : null;

  return (
    <div style={styles.container}>
      <h2 style={styles.titulo}>Consulta de Presenças</h2>

      <div style={styles.filtros}>
        <input
          type="text"
          placeholder="Digite seu CPF"
          value={cpf}
          onChange={(e) => {
            setCpf(e.target.value);
            setResultados([]);
            setBuscaExecutada(false);
          }}
          style={styles.input}
        />
        <select
          value={mes}
          onChange={(e) => {
            setMes(e.target.value);
            setResultados([]);
            setBuscaExecutada(false);
          }}
          style={styles.input}
        >
          <option value="">Selecione o mês</option>
          {Array.from({ length: 12 }, (_, i) => i + 1).map((num) => (
            <option key={num} value={String(num).padStart(2, "0")}>
              {new Date(0, num - 1).toLocaleString("pt-BR", { month: "long" })}
            </option>
          ))}
        </select>
        <select
          value={ano}
          onChange={(e) => {
            setAno(e.target.value);
            setResultados([]);
            setBuscaExecutada(false);
          }}
          style={styles.input}
        >
          <option value="">Selecione o ano</option>
          {[2023, 2024, 2025, 2026].map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>
        <button onClick={buscaButton} style={styles.botao}>
          Buscar
        </button>
      </div>

      <div style={styles.lista}>
        {resultados.length > 0 ? (
          <>
            {/* Se aluno existe, exibe os dados pessoais */}
            {aluno && (
              <div style={styles.detalhesAluno}>
                <h3>Informações do Aluno</h3>
                <p><strong>Nome:</strong> {aluno.Nome}</p>
                <p><strong>IES:</strong> {aluno.IES}</p>
                <p><strong>Curso:</strong> {aluno.Curso}</p>
                <p><strong>Turno:</strong> {aluno.Turno}</p>
                <p><strong>CPF:</strong> {aluno.CPF}</p>
                {/* Exibe o Período calculado */}
                {mes && ano && aluno.Matricula && (() => {
                  const anoAtual = parseInt(ano, 10);
                  const semestreAtual = semestreAtualPeloMes(mes);
                  const { periodoStr } = calcularPeriodoEGresso(aluno.Matricula, anoAtual, semestreAtual);
                  return <p><strong>Período:</strong> {periodoStr}</p>;
                })()}
                <p><strong>Semestre de Entrada:</strong> {`${String(aluno.Matricula).slice(0, -1)}.${String(aluno.Matricula).slice(-1)}`}</p>
                <p><strong>Email:</strong> {aluno.Email}</p>
              </div>
            )}

            <p style={styles.resumo}>
              Total de presenças encontradas: <strong>{resultados.length}</strong>
            </p>
            <ul>
              {resultados.map((item, index) => (
                <li key={index} style={styles.item}>
                  <strong>{item["Data"]}</strong>
                </li>
              ))}
            </ul>
          </>
        ) : buscaExecutada ? (
          <p>Nenhuma presença encontrada.</p>
        ) : (
          <p>Preencha os dados e clique em Buscar para consultar.</p>
        )}
      </div>
    </div>
  );
}

const styles = {
  container: {
    padding: "2rem",
    fontFamily: "'Segoe UI', sans-serif",
    backgroundColor: "#f4f4f4",
    minHeight: "100vh",
  },
  titulo: {
    fontSize: "1.8rem",
    marginBottom: "1rem",
    textAlign: "center",
    color: "#333",
  },
  filtros: {
    display: "flex",
    justifyContent: "center",
    gap: "1rem",
    flexWrap: "wrap",
    marginBottom: "1.5rem",
  },
  input: {
    padding: "0.6rem 1rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "1px solid #ccc",
    width: "200px",
  },
  botao: {
    padding: "0.6rem 1.5rem",
    fontSize: "1rem",
    borderRadius: "6px",
    border: "none",
    backgroundColor: "#3f51b5",
    color: "white",
    fontWeight: "600",
    cursor: "pointer",
    boxShadow: "0 3px 6px rgba(0,0,0,0.1)",
  },
  lista: {
    backgroundColor: "white",
    padding: "1rem 1.5rem",
    borderRadius: "10px",
    boxShadow: "0 2px 10px rgba(0,0,0,0.05)",
    maxWidth: "600px",
    margin: "0 auto",
  },
  item: {
    padding: "0.5rem 0",
    borderBottom: "1px solid #eee",
  },
  resumo: {
    marginBottom: "1rem",
    fontWeight: "bold",
    color: "#444",
  },
  detalhesAluno: {
    backgroundColor: "#eef3ff",
    padding: "1rem 1.5rem",
    borderRadius: "8px",
    marginBottom: "1rem",
    boxShadow: "0 1px 4px rgba(0,0,0,0.1)",
    color: "#1a1a1a",
  },
};
