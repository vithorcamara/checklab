// Importações...
import { useState, useEffect } from 'react';
import { db, auth } from '../../../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';
import PresencaView from '../../components/PresencaView';
import RelatorioView from '../../components/RelatorioView';
import CadastroView from '../../components/CadastroView';

export default function Home() {
  const [usuario, setUsuario] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [dadosPlanilha, setDadosPlanilha] = useState([]);
  const [dadosRelatorio, setDadosRelatorio] = useState([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [dataPresenca, setDataPresenca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [loadingRegistro, setLoadingRegistro] = useState(false);
  const [abas, setAbas] = useState(['presença', 'relatórios', 'cadastro']); // Abas disponívei
  const [aba, setAba] = useState('presença'); // Estado para abas, se necessário
  const [nomeFiltro, setNomeFiltro] = useState("");
  const [dataInicio, setDataInicio] = useState("");
  const [dataFim, setDataFim] = useState("");
  const [filtroTicket, setFiltroTicket] = useState("Todos");


  // Estados de ordenação
  const [colunaOrdenada, setColunaOrdenada] = useState('');
  const [ordem, setOrdem] = useState('asc');

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (!user) return (window.location.href = '/login');
      setUsuario(user);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const carregarDadosUsuario = async () => {
      if (!usuario?.uid) return;

      try {
        const usuarioRef = doc(db, 'checklab', usuario.uid);
        const usuarioSnapshot = await getDoc(usuarioRef);

        if (usuarioSnapshot.exists()) {
          const dados = usuarioSnapshot.data();
          setDadosUsuario({
            nome: dados.nome || '',
            sobrenome: dados.sobrenome || '',
            cargo: dados.cargo || '',
            organizacao: dados.organizacao || '',
          });
        } else {
          console.warn('Documento do usuário não encontrado na coleção checklab.');
        }
      } catch (error) {
        console.error('Erro ao carregar dados do usuário:', error);
      }
    };
    carregarDadosUsuario();
  }, [usuario]);

  useEffect(() => {
    const buscarDadosPlanilha = async () => {
      try {
        const response = await axios.get('https://check-api-qpu9.onrender.com/dados');
        setDadosPlanilha(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados da planilha:', error);
      }
    };
    buscarDadosPlanilha();
  }, []);

  useEffect(() => {
    const buscarPresença = async () => {
      try {
        const response = await axios.get('https://check-api-qpu9.onrender.com/resumo');
        setDadosRelatorio(response.data);
      } catch (error) {
        console.error('Erro ao buscar dados da planilha:', error);
      }
    };
    buscarPresença();
  }, []);

  const handleLogout = () => {
    signOut(auth);
    window.location.href = '/';
  };

  const registrarPresenca = async () => {
    if (!alunoSelecionado || !dataPresenca) {
      alert('Selecione um aluno e uma data.');
      return;
    }

    const dadosParaEnviar = {
      ID: alunoSelecionado["ID"],
      "Nome Social": alunoSelecionado["Nome Social"],
      "Matrícula": alunoSelecionado["Matrícula"],
      IES: alunoSelecionado["IES"],
      Curso: alunoSelecionado["Curso"],
      Turno: alunoSelecionado["Turno"],
      "E-mail": alunoSelecionado["E-mail"],
      Ticket: alunoSelecionado["Ticket"],
      Data: dataPresenca,
      "Usuário": `${dadosUsuario.nome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}.${dadosUsuario.sobrenome.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")}`,
    };

    try {
      setLoadingRegistro(true);
      await axios.post('https://check-api-qpu9.onrender.com/addAluno', dadosParaEnviar);
      alert('Presença registrada com sucesso!');
      setAlunoSelecionado(null);
      setDataPresenca('');
    } catch (error) {
      console.error('Erro ao registrar presença:', error);
      alert('Erro ao registrar presença. Veja o console.');
    } finally {
      setLoadingRegistro(false);
      setBuscaNome("");
    }
  };

  // Ordenação
  const handleOrdenacao = (coluna) => {
    const novaOrdem = colunaOrdenada === coluna && ordem === 'asc' ? 'desc' : 'asc';
    const dadosOrdenados = [...dadosPlanilha].sort((a, b) => {
      const valorA = (a[coluna] || '').toString().toLowerCase();
      const valorB = (b[coluna] || '').toString().toLowerCase();
      if (valorA < valorB) return novaOrdem === 'asc' ? -1 : 1;
      if (valorA > valorB) return novaOrdem === 'asc' ? 1 : -1;
      return 0;
    });

    setDadosPlanilha(dadosOrdenados);
    setColunaOrdenada(coluna);
    setOrdem(novaOrdem);
  };

  const dadosFiltrados = dadosPlanilha.filter(aluno =>
    aluno["Nome Social"]?.toLowerCase().includes(buscaNome.toLowerCase())
  );

  const selectAba = () => {
    switch (aba) {
            case 'presença':
              return (
                <PresencaView
                  styles={styles}
                  buscaNome={buscaNome}
                  setBuscaNome={setBuscaNome}
                  dataPresenca={dataPresenca}
                  setDataPresenca={setDataPresenca}
                  dadosPlanilha={dadosFiltrados}
                  alunoSelecionado={alunoSelecionado}
                  setAlunoSelecionado={setAlunoSelecionado}
                  loadingRegistro={loadingRegistro}
                  registrarPresenca={registrarPresenca}
                  handleOrdenacao={handleOrdenacao}
                  dadosFiltrados={dadosFiltrados}
                />
              );
            case 'relatórios':
                return(
                  <RelatorioView
                    styles={styles}
                    dados={dadosRelatorio}
                    nomeFiltro={nomeFiltro}
                    setNomeFiltro={setNomeFiltro}
                    dataInicio={dataInicio}
                    setDataInicio={setDataInicio}
                    dataFim={dataFim}
                    setDataFim={setDataFim}
                    filtroTicket={filtroTicket}
                    setFiltroTicket={setFiltroTicket}
                  />
                );
              case 'cadastro':
                return(
                  <CadastroView/>
                )
            default:
              return null;
          }
  }

  return (
    <div style={styles.layout}>
      <div style={styles.container}>
        <div style={styles.header}>
          {dadosUsuario ? (
            <h2><span style={{ textTransform: 'capitalize' }}>{dadosUsuario.nome} {dadosUsuario.sobrenome} - {dadosUsuario.cargo}</span> {dadosUsuario.organizacao}</h2>
          ) : (
            <h2>Carregando dados do usuário...</h2>
          )}
          <button onClick={handleLogout} style={styles.logout}>Sair</button>
        </div>
        
        {dadosUsuario?.organizacao === 'Embarque Digital' &&
  dadosUsuario?.cargo === 'Administração' && (
    <div style={styles.menuButtons}>
      {abas.map((abaItem) => (
        <button
          key={abaItem}
          onClick={() => setAba(abaItem)}
          style={{
            margin: '0.5rem',
            padding: '0.5rem 1rem',
            backgroundColor: aba === abaItem ? '#3f51b5' : '#e0e0e0',
            color: aba === abaItem ? 'white' : '#333',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontWeight: '600',
          }}
        >
          {abaItem.charAt(0).toUpperCase() + abaItem.slice(1)}
        </button>
      ))}
    </div>
)}

        
        {selectAba()}

      </div>
    </div>
  );
}

// Styles (sem alteração)
const styles = {
  layout: { display: 'flex', height: '100vh', width: '100vw', fontFamily: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif", backgroundColor: '#f9f9f9' },
  container: { flex: 1, display: 'flex', flexDirection: 'column', padding: '2rem' },
  header: { padding: '1rem 0', borderBottom: '1px solid #ddd', color: '#333', display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  logout: { backgroundColor: '#ef5350', color: 'white', border: 'none', padding: '0.6rem 1.2rem', cursor: 'pointer', borderRadius: '6px', fontWeight: '600', transition: 'background-color 0.3s ease' },
  listContainer: { marginTop: '1.5rem', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '10px', boxShadow: '0 4px 15px rgb(0 0 0 / 0.07)', height: '520px', overflowY: 'auto', display: 'flex', flexDirection: 'column' },
  inputBusca: { padding: '0.7rem 1rem', width: '280px', fontSize: '1rem', borderRadius: '8px', border: '1.5px solid #ccc', outline: 'none', transition: 'border-color 0.3s ease' },
  inputData: { marginLeft: '1.2rem', padding: '0.7rem 1rem', fontSize: '1rem', borderRadius: '8px', border: '1.5px solid #ccc', outline: 'none', transition: 'border-color 0.3s ease' },
  botaoRegistrar: { marginLeft: '1.2rem', backgroundColor: '#3f51b5', color: 'white', border: 'none', padding: '0.7rem 1.5rem', cursor: 'pointer', borderRadius: '8px', fontWeight: '600', boxShadow: '0 3px 8px rgb(63 81 181 / 0.4)', transition: 'background-color 0.3s ease, box-shadow 0.3s ease' },
  menuButtons: { display: 'flex', width: '100vw', justifyContent: 'center', marginBottom: '1rem' },
};
