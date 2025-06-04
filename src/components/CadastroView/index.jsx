import { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from 'firebase/auth';
import { auth, db } from '../../../services/firebase';
import { collection, getDocs, doc, setDoc } from 'firebase/firestore';

export default function CadastroView() {
  const [usuario, setUsuario] = useState('');
  const [org, setOrg] = useState('');
  const [cargo, setCargo] = useState('');
  const [senha, setSenha] = useState('');
  const [erro, setErro] = useState('');
  const [sucesso, setSucesso] = useState('');

  const [organizacoes, setOrganizacoes] = useState([]);
  const [cargosDisponiveis, setCargosDisponiveis] = useState([]);

  useEffect(() => {
    const fetchOrganizacoes = async () => {
      try {
        const snapshot = await getDocs(collection(db, 'organizacao'));
        const orgs = snapshot.docs.map(doc => ({
          id: doc.id,
          nome: doc.data().nome,
          cargos: doc.data().cargos || []
        }));
        setOrganizacoes(orgs);
      } catch (error) {
        console.error('Erro ao buscar organizações:', error);
      }
    };

    fetchOrganizacoes();
  }, []);

  useEffect(() => {
    const orgSelecionada = organizacoes.find(o => o.id === org);
    setCargosDisponiveis(orgSelecionada ? orgSelecionada.cargos : []);
    setCargo('');
  }, [org, organizacoes]);

  const gerarEmail = () => {
    const orgObj = organizacoes.find(o => o.id === org);
    if (!usuario || !cargo || !orgObj) return '';
    return `${usuario}@${cargo[0].toLowerCase()}.${orgObj.nome.replace(/\s+/g, '').toLowerCase()}`;
  };

  const handleCadastro = async (e) => {
    e.preventDefault();
    setErro('');
    setSucesso('');

    const email = gerarEmail();

    if (!email || !senha) {
      setErro('Preencha todos os campos corretamente.');
      return;
    }

    try {
      // Criar usuário no Auth
      const userCredential = await createUserWithEmailAndPassword(auth, email, senha);
      const { user } = userCredential;

      // Separar nome e sobrenome do usuário
      const parts = usuario.split('.');
      const nome = parts[0] || '';
      const sobrenome = parts[1] || '';

      // Organização final
      const orgObj = organizacoes.find(o => o.id === org);
      const organizacaoFinal = orgObj?.nome === 'Embarque' ? 'Embarque Digital' : orgObj?.nome || '';

      // Gravar dados no Firestore em chats/{uid}
      await setDoc(doc(db, 'checklab', user.uid), {
        nome,
        sobrenome,
        cargo,
        organizacao: organizacaoFinal
      });

      setSucesso(`Usuário ${usuario} cadastrado com sucesso!`);
      setUsuario('');
      setSenha('');
      setOrg('');
      setCargo('');
      signOut(auth);
      window.location.href = '/';
    } catch (error) {
      setErro('Erro ao cadastrar usuário: ' + error.message);
      console.error(error);
    }
  };

  return (
    <div className="login-container">
      <h2>Cadastro de Usuário</h2>
      <form onSubmit={handleCadastro}>
        <div className="input-group">
          <input
            type="text"
            id="usuario"
            value={usuario}
            onChange={(e) => setUsuario(e.target.value)}
            required
            placeholder=" "
          />
          <label htmlFor="usuario">Nome de usuário</label>
        </div>

        <div className="input-group">
          <select
            id="org"
            value={org}
            onChange={(e) => setOrg(e.target.value)}
            required
          >
            <option value="">Selecione a organização</option>
            {organizacoes.map((o) => (
              <option key={o.id} value={o.id}>{o.nome}</option>
            ))}
          </select>
          <label htmlFor="org">Organização</label>
        </div>

        {cargosDisponiveis.length > 0 && (
          <div className="input-group">
            <select
              id="cargo"
              value={cargo}
              onChange={(e) => setCargo(e.target.value)}
              required
            >
              <option value="">Selecione o cargo</option>
              {cargosDisponiveis.map((c, index) => (
                <option key={index} value={c}>{c}</option>
              ))}
            </select>
            <label htmlFor="cargo">Cargo</label>
          </div>
        )}

        <div className="input-group">
          <input
            type="password"
            id="senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            required
            placeholder=" "
          />
          <label htmlFor="senha">Senha</label>
        </div>

        <button type="submit">Cadastrar</button>
      </form>

      {erro && <p className="erro">{erro}</p>}
      {sucesso && <p className="sucesso">{sucesso}</p>}
    </div>
  );
}
