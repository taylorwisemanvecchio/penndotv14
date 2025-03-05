"use client";

import { useState, useRef, useEffect } from "react";
import axios from "axios";
import Head from "next/head";
import ReactMarkdown from "react-markdown";
import {
    AppBar,
    Toolbar,
    Typography,
    Container,
    Box,
    Paper,
    TextField,
    IconButton,
    Avatar,
    Drawer,
    List,
    ListItem,
    ListItemText
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import { getUser } from "@/app/api/auth/getUser";
import Image from "next/image";
import logo from "@/../public/logo.webp"; // Ensure logo is in the public folder

interface ChatMessage {
    role: "user" | "assistant";
    text: string;
}

export default function ChatPage() {
    const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
    const [input, setInput] = useState<string>("");
    const [loading, setLoading] = useState<boolean>(false);
    const [userName, setUserName] = useState<string>("User");

    const assistantAvatar = "/assistant.png";
    const messagesEndRef = useRef<HTMLDivElement | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const name = await getUser();
            setUserName(name);
        };
        fetchUser();
    }, []);

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [chatMessages, loading]);

    const sendMessage = async (message: string) => {
        if (!message.trim()) return;
        const newMessages: ChatMessage[] = [...chatMessages, { role: "user", text: message }];
        setChatMessages(newMessages);
        setLoading(true);

        try {
            const response = await axios.post("/api/chat", { message });
            const messagesData = response.data.messages?.data || [];

            const assistantMessages: ChatMessage[] = messagesData
                .filter((msg: any) => msg.role === "assistant")
                .map((msg: any) => ({
                    role: msg.role,
                    text: msg.content.map((part: any) => part.text.value).join(" "),
                }));

            setChatMessages([...newMessages, ...assistantMessages]);
        } catch (error) {
            console.error("Error sending message:", (error as any).response?.data || (error as any).message);
            setChatMessages([
                ...newMessages,
                { role: "assistant", text: "Error: Unable to get response. Please try again." },
            ]);
        } finally {
            setLoading(false);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            const message = input;
            setInput("");
            sendMessage(message);
        }
    };

    return (
        <Box sx={{ height: "100vh", display: "flex", flexDirection: "row" }}>
            <Head>
                <title>Wiseman AI</title>
                <meta name="description" content="PennDoT" />
            </Head>

            {/* Sidebar */}
            <Drawer
                variant="permanent"
                sx={{
                    width: 270,
                    flexShrink: 0,
                    "& .MuiDrawer-paper": { width: 270, boxSizing: "border-box",  display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", padding: 2 },
                }}
            >
                <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center", mb: 2 }}>
                    <Image src={logo} alt="Wiseman AI Logo" width={250} height={100} />
                </Box>
                <Typography variant="h6" sx={{ textAlign: "center", mb: 2 }}>
                    Chat Tips
                </Typography>
                <List>
                    {[
                        "Prepare your prompt on a word processor, then copy and paste for ease of use.",
                        "The Enter key sends the prompt to Wiseman AI.",
                        "List the project team members for a tailored response.",
                        "Let Wiseman AI know if you would like specific past projects included in the response.",
                        "Ask about or discuss technical subject matter. Wiseman AI can identify past projects with relevant technical topics.",
                    ].map((tip, index) => (
                        <ListItem key={index} sx={{ alignItems: "flex-start" }}>
                            <ListItemText primary={`➣  ${tip}`} />
                        </ListItem>
                    ))}
                </List>
            </Drawer>
			
			

            {/* Main Chat Interface */}
            <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
                {/* AppBar with Welcome Message */}
                <AppBar position="static" sx={{ bgcolor: "#00653b" }}>
                    <Toolbar sx={{ display: "flex", justifyContent: "space-between" }}>
                        <Typography variant="h6">Wiseman AI: PennDot Assistant</Typography>
                        <Typography variant="body1" sx={{ fontSize: "0.9rem", fontWeight: 500 }}>
                            Welcome, {userName}
                        </Typography>
                    </Toolbar>
                </AppBar>
				


                {/* Chat Container */}
                <Container maxWidth="md" sx={{ flex: 1, py: 2, display: "flex", flexDirection: "column" }}>
                    <Paper elevation={3} sx={{ flex: 1, display: "flex", flexDirection: "column", p: 2, borderRadius: 2 }}>
                        {/* Chat messages area (Scrollable) */}
                        <Box sx={{ flexGrow: 1, overflowY: "auto", mb: 2 }}>
                            {chatMessages.map((msg, index) => (
                                <Box
                                    key={index}
                                    sx={{
                                        display: "flex",
                                        mb: 2,
                                        flexDirection: msg.role === "assistant" ? "row" : "row-reverse",
                                        alignItems: "flex-start",
                                    }}
                                >
                                    {msg.role === "assistant" && (
                                        <Avatar src={assistantAvatar} alt="Wiseman AI" sx={{ mr: 1, width: 40, height: 40 }} />
                                    )}
                                    <Box sx={{ maxWidth: "80%" }}>
                                        <Paper
                                            elevation={3}
                                            sx={{
                                                p: 1.5,
                                                borderRadius: 2,
                                                backgroundColor:
                                                    msg.role === "assistant" ? "primary.light" : "secondary.light",
                                            }}
                                        >
                                            <Typography variant="subtitle2" sx={{ fontWeight: "bold" }}>
                                                {msg.role === "assistant" ? "Wiseman AI" : "You"}
                                            </Typography>
                                            <ReactMarkdown>{msg.text}</ReactMarkdown>
                                        </Paper>
                                    </Box>
                                    {msg.role === "user" && (
                                        <Avatar sx={{ ml: 1, bgcolor: "secondary.main", width: 40, height: 40 }}>U</Avatar>
                                    )}
                                </Box>
                            ))}
                            <div ref={messagesEndRef} />
                        </Box>

                        {/* Chat Input Area */}
                        <Box sx={{ display: "flex", alignItems: "center", position: "sticky", bottom: 0, bgcolor: "white", p: 2 }}>
                            <TextField
                                multiline
                                fullWidth
                                minRows={2}
                                placeholder="Type your message..."
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                onKeyDown={handleKeyDown}
                                sx={{ flex: 1 }}
                            />
                            <IconButton color="primary" onClick={() => sendMessage(input)} disabled={loading || !input.trim()} sx={{ ml: 1 }}>
                                <SendIcon />
                            </IconButton>
                        </Box>
                    </Paper>
                </Container>
            </Box>
        </Box>
    );
}
