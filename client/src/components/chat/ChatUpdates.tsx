// Arquivo temporário com as mudanças que precisamos fazer

// 1. No componente ChannelList, adicionar botão de menu no canto superior esquerdo:
<div className="flex items-center">
  <Button 
    variant="ghost" 
    size="icon" 
    className="mr-1" 
    onClick={() => window.location.href = '/'}
  >
    <Menu className="h-5 w-5" />
  </Button>
  <h2 className="text-base sm:text-lg font-semibold">Chat</h2>
</div>

// 2. Remover as mensagens de "Nenhum canal encontrado Criar canal" das seções

// Em vez de:
{filteredRooms.filter(room => room.type === 'group').length === 0 && (
  <div className="px-2 py-2 text-sm text-gray-500 dark:text-gray-400">
    Nenhum canal encontrado
  </div>
)}

// Substitua por:
{/* Removida exibição de "nenhum canal encontrado" */}

// 3. Remover botões de criar canal e excluir conversas da tela central

// Em vez de:
<div className="flex-1 flex items-center justify-center">
  <div className="text-center p-8">
    <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat</h3>
    <p className="text-gray-500 mb-6">Selecione um canal para iniciar a conversa</p>
    <div className="flex flex-col gap-3">
      <Button onClick={() => setShowNewRoomDialog(true)}>
        Criar um novo canal
      </Button>
      
      {/* Botão para limpar dados, disponível apenas para administradores */}
      {user?.role === 'admin' && (
        <Button
          onClick={async () => {
            // implementação
          }}
          variant="outline"
          className="text-red-500 hover:text-red-700 hover:bg-red-50"
        >
          Limpar todos os dados de chat
        </Button>
      )}
    </div>
  </div>
</div>

// Substitua por:
<div className="flex-1 flex items-center justify-center">
  <div className="text-center p-8">
    <h3 className="text-xl font-medium mb-2">Bem-vindo ao Chat</h3>
    <p className="text-gray-500 mb-6">Selecione uma conversa no menu lateral para começar</p>
    <div className="flex items-center justify-center">
      <MessageSquare className="w-12 h-12 text-gray-400" />
    </div>
  </div>
</div>