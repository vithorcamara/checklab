/* eslint-disable react/prop-types */
export default function PresencaView({ styles, buscaNome, setBuscaNome, dataPresenca, setDataPresenca, dadosPlanilha, alunoSelecionado, setAlunoSelecionado, loadingRegistro, registrarPresenca, handleOrdenacao, dadosFiltrados }) {
    return (
        <>
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
        </>
    )
}