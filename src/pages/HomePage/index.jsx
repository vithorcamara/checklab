// Importações...
import { useState, useEffect } from 'react';
import { db, auth } from '../../../services/firebase';
import { signOut, onAuthStateChanged } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import axios from 'axios';

export default function Home() {
  const [usuario, setUsuario] = useState(null);
  const [dadosUsuario, setDadosUsuario] = useState(null);
  const [dadosPlanilha, setDadosPlanilha] = useState([]);
  const [buscaNome, setBuscaNome] = useState('');
  const [dataPresenca, setDataPresenca] = useState('');
  const [alunoSelecionado, setAlunoSelecionado] = useState(null);
  const [loadingRegistro, setLoadingRegistro] = useState(false);

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

        <div>
          <h3>Dados da Planilha</h3>

          <input
            type="text"
            placeholder="Buscar por nome..."
            value={buscaNome}
            onChange={(e) => setBuscaNome(e.target.value)}
            style={styles.inputBusca}
          />

          <input
            type="date"
            value={dataPresenca}
            onChange={(e) => setDataPresenca(e.target.value)}
            style={styles.inputData}
          />

          <button
            onClick={registrarPresenca}
            disabled={loadingRegistro}
            style={styles.botaoRegistrar}
          >
            {loadingRegistro ? 'Registrando...' : 'Registrar Presença'}
          </button>
        </div>

        <div style={styles.listContainer}>
          {dadosPlanilha.length === 0 ? (
            <p>Carregando dados...</p>
          ) : (
            <table className="min-w-full bg-white border rounded-xl shadow" style={{ marginTop: '1rem' }}>
              <thead>
                <tr className="bg-gray-200 text-gray-700 text-left text-sm">
                  <th className="py-2 px-4"></th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("Nome Social")}>Nome</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("Matrícula")}>Matrícula</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("Curso")}>Curso</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("Turno")}>Turno</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("E-mail")}>E-mail</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("IES")}>IES</th>
                  <th className="py-2 px-4 cursor-pointer" onClick={() => handleOrdenacao("Ticket")}>Ticket</th>
                </tr>
              </thead>
              <tbody>
                {dadosFiltrados.map((aluno, index) => (
                  <tr
                    key={index}
                    className="border-t hover:bg-gray-50"
                    style={{
                      backgroundColor: alunoSelecionado === aluno ? '#e0f7fa' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => setAlunoSelecionado(aluno)}
                  >
                    <td className="py-2 px-4">
                      <input
                        type="radio"
                        name="alunoSelecionado"
                        checked={alunoSelecionado === aluno}
                        onChange={() => setAlunoSelecionado(aluno)}
                        style={{ display: 'none' }}
                      />
                    </td>
                    <td className="py-2 px-4">{aluno["Nome Social"]}</td>
                    <td className="py-2 px-4">{aluno["Matrícula"]}</td>
                    <td className="py-2 px-4">{aluno["Curso"]}</td>
                    <td className="py-2 px-4">{aluno["Turno"]}</td>
                    <td className="py-2 px-4">{aluno["E-mail"]}</td>
                    <td className="py-2 px-4">{aluno["IES"]}</td>
                    <td className="py-2 px-4">{aluno["Ticket"] === "TRUE" ? "Sim" : "Não"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
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
};
