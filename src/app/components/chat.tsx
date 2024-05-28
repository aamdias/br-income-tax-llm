'use client'

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useChat } from "ai/react";
import { useRef, useEffect } from 'react';

const defaultQuestions = [
    "quem precisa declarar o imposto de renda em 2024?",
    "quais documentos são necessários para a declaração?",
    "o que acontece se eu não declarar o imposto de renda?",
];

export function Chat() {
    const { messages, input, handleInputChange, handleSubmit, error, setInput } = useChat({
        api: '/api/chat',
    });
    const chatParent = useRef<HTMLUListElement>(null);

    useEffect(() => {
        const domNode = chatParent.current;
        if (domNode) {
            domNode.scrollTop = domNode.scrollHeight;
        }
    }, [messages]);

    const handleBadgeClick = (question: string) => {
        setInput(question);
    };

    return (
        <main className="flex flex-col w-full h-screen max-h-dvh bg-background">
            <header className="p-4 border-b w-full max-w-3xl mx-auto">
                <h1 className="text-2xl font-bold">Perguntas & Respostas sobre a DIPF 2024</h1>
            </header>

            <section className="container px-0 pb-10 flex flex-col flex-grow gap-4 mx-auto max-w-3xl">
                <ul ref={chatParent} className="h-1 p-4 flex-grow bg-muted/50 rounded-lg overflow-y-auto flex flex-col gap-4">
                    {messages.map((m, index) => (
                        <li key={index} className={m.role === 'user' ? "flex flex-row" : "flex flex-row-reverse"}>
                            <div className="rounded-xl p-4 bg-background shadow-md flex w-3/4">
                                <p className="text-primary">{m.role === 'user' ? m.content : <><span className="font-bold">Resposta: </span>{m.content}</>}</p>
                            </div>
                        </li>
                    ))}
                </ul>
            </section>

            <section className="p-4">
            <div className="flex flex-col w-full max-w-3xl mx-auto space-y-2">
                    <div className="flex items-center flex-wrap gap-2">
                        {defaultQuestions.map((question, index) => (
                            <Button key={index} className="badge text-xs px-2 py-1 bg-zinc-500" onClick={() => handleBadgeClick(question)}>
                                {question}
                            </Button>
                        ))}
                    </div>
                    <form onSubmit={handleSubmit} className="flex w-full items-center">
                        <Input className="flex-1 min-h-[40px]" placeholder="Escreva sua pergunta aqui..." type="text" value={input} onChange={handleInputChange} />
                        <Button className="ml-2" type="submit">
                            Enviar
                        </Button>
                    </form>
                    {error && <p className="text-red-500 mt-2">Error: {error.message}</p>}
                </div>
            </section>
        </main>
    );
}
