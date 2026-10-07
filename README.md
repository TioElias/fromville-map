# Singularity Pruned no Kaggle T4 × 2

Este notebook foi adaptado **do arquivo enviado pelo usuário que já abre o ComfyUI**. A instalação direta, o uso de `/kaggle/temp`, o encoder na segunda T4, o túnel e a interface foram preservados. Não usa `venv`/`ensurepip`.

Importe `minimax_h3_pruned_kaggle.ipynb`, confirme o banner **singularity-working-base-r1**, selecione T4 × 2 e Internet e execute em ordem. Abra **Workflows → singularity_pruned_t4x2** e envie suas referências pelo ComfyUI.

## Pesos e amostragem

O checkpoint é **Singularity REF2VA Pruned v1.3 INT8**, da distribuição apontada pelo [autor](https://github.com/AIGC-Singularity/Minimax-h3_Singularity): [WarmBloodAban/Minimax-h3_Singularity](https://huggingface.co/WarmBloodAban/Minimax-h3_Singularity). O notebook confere o nome exato no catálogo durante a execução, ou reutiliza um arquivo anexado configurado em `SINGULARITY_LOCAL_PATH`. Não baixa o REF2VA oficial como substituto nem escolhe silenciosamente uma versão completa.

Mantém o Qwen NVFP4 e os VAEs INT8/FP32 do notebook enviado. Usa a LoRA **REF2V 4step v0.1**, uma única passagem e **6 passos reais**, com Euler + beta. Não empilha LoRAs de velocidade. O template fixa tanto o widget quanto as entradas conectadas que determinam o número de passos.

As referências a DualClock T8 no JSON antigo não identificam a origem desse plugin. A adaptação usa sampling nativo, como o workflow público do autor. Os nós Dual-T4 existentes são mantidos. O grafo gerado não depende dos nós de upscale, tradução ou vídeo de referência do JSON antigo.

## Alternativa para testar o layout do workflow original

`workflow_singularity_dualclock_compativel.json` mantém o layout e as referências do JSON enviado, mas substitui o T8 ausente pelo nó público [`MiniMaxH3DualClockEulerSampler`](https://github.com/shuaixn/ComfyUI-MiniMaxH3DualClockSampler), com `BasicScheduler` separado, beta e 6 passos. Não é uma implementação recuperada do T8 e não há garantia de resultado equivalente. No ComfyUI com `ModelSamplingAV`, o plugin delega ao Euler nativo. O README desse plugin valida outro conjunto de modelo/LoRA, não este Singularity Pruned.

Para instalar na sessão existente, salve suas edições e interrompa somente a célula que mantém o servidor aberto. Execute `instalar_dualclock_kaggle.py` em uma célula Python, depois execute novamente somente a célula do servidor. O instalador fixa o plugin no commit `986f8e9ebd4477caa6395eead23d968648cc7a7d`, confere o workflow, preserva instalações de outra versão e não reinstala dependências ou pesos. Abra `singularity_original_dualclock_compativel` em Workflows, envie sua imagem e revise o prompt. O perfil inicial é 0.2 MP e 2.3 segundos. Os nós Set/Get, Text e VideoHelperSuite que você instalou continuam necessários; a segunda passagem continua em bypass.

A validação local confere todos os links do JSON e o caminho de amostragem no ComfyUI, sem carregar pesos reais. A geração com este workflow precisa ser testada no Kaggle.

## Workflows para testar na interface já aberta, sem DualClock

Baixe e arraste `workflow_singularity_sem_dualclock_acelerado.json` para a tela do ComfyUI. É um grafo novo, com uma imagem de referência, Singularity REF2VA Pruned INT8, Qwen NVFP4 na segunda T4, VAEs INT8/FP32, uma LoRA REF2V turbo 4step v0.1 e uma passagem de Euler nativo + beta. Começa em 608 × 352, 56 frames, 6 passos e seed 42. Selecione sua imagem, confira o nome do checkpoint instalado e revise o prompt. O vídeo usa `SaveVideo` nativo e o diretório de saída já configurado no notebook.

A versão acelerada mantém ativos `MiniMaxChunkFeedForward` (4 partes) e `MiniMaxLowVRAMAttention` (4 grupos), do KJNodes. O nó `MiniMaxH3MemoryEfficientSageAttentionPatch` fica **em bypass por padrão** após a sessão Kaggle reportar que a biblioteca não estava disponível/compatível ou a arquitetura CUDA não pôde ser detectada. SageAttention precisa da biblioteca e dos kernels compatíveis; reconhecer o nó na interface não garante que a biblioteca esteja disponível. Em uma cópia antiga do JSON, selecione só o nó 7 (SageAttention) e use Ctrl+B para colocá-lo em bypass, sem reiniciar ou perder as referências. Os patches em partes e o VAE tiled reduzem picos de VRAM, mas podem aumentar o tempo; o nome do arquivo não representa um benchmark de velocidade.

`workflow_singularity_sem_dualclock_base.json` oferece os mesmos pesos, prompt, seed, perfil e VAE tiled, sem depender de KJNodes/SageAttention. Use-o se os nós opcionais não estiverem carregados na sessão, ou para comparar tempo e resultado. Ambos mantêm os carregadores Dual-T4 já criados pelo notebook; importar o JSON não instala pacotes, baixa pesos ou reinicia o servidor. Nenhum dos dois contém um nó DualClock. As LoRAs de velocidade de 4 e 8 passos são alternativas, não são empilhadas. TorchCompile, caches e outras extensões não verificadas na sessão não são adicionados.

Validação: conexões do JSON, valores de widgets e grafo de geração aceito pelo ComfyUI v0.32.0, usando as definições reais dos nós KJ. O teste usa arquivos mínimos somente para validar nomes e tipos; não carrega pesos reais, executa kernels GPU, mede desempenho ou comprova qualidade. A geração e a compatibilidade dos patches com os pesos precisam ser verificadas no Kaggle.

## Armazenamento e validação

Pesos anexados são reutilizados por symlink. Downloads faltantes vão para `/kaggle/temp`, com verificação do tamanho publicado e do espaço disponível. `/kaggle/working` fica para workflows, logs e os vídeos que forem salvos pela célula de resgate.

Validação local: notebook, sintaxe das células, seleção segura da variante pruned, uma LoRA, uma passagem, passos conectados e consistência dos links. As células de instalação e de abertura do notebook enviado foram preservadas. A inferência com Singularity e a qualidade visual não foram testadas neste ambiente sem GPU/pesos. A API Hugging Face está bloqueada pela política de rede deste ambiente; a consulta ao catálogo será feita no Kaggle, onde o notebook enviado já demonstra downloads funcionando.
