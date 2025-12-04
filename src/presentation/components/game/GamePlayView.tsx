"use client";

import {
  AI_AVATARS,
  AI_NAMES,
  DEFAULT_AI_CONFIG,
  generateAIPlayerId,
  isAIPlayer,
  makeAIDecision,
  type AIDifficulty,
} from "@/src/domain/services/aiService";
import type { Card } from "@/src/domain/types/card";
import { PLAYER_RANK_DISPLAY } from "@/src/domain/types/card";
import type {
  DealCardsMessage,
  PassTurnMessage,
  PeerMessage,
  PlayCardsMessage,
} from "@/src/domain/types/peer";
import {
  containsThreeOfClubs,
  createPlayedHand,
  sortCards,
} from "@/src/domain/utils/cardUtils";
import { cn } from "@/src/lib/utils";
import { useConnectionStore } from "@/src/presentation/stores/connectionStore";
import { RANK_SCORES, useGameStore } from "@/src/presentation/stores/gameStore";
import { usePeerStore } from "@/src/presentation/stores/peerStore";
import { useUserStore } from "@/src/presentation/stores/userStore";
import {
  ArrowLeft,
  Bot,
  Copy,
  Loader2,
  RefreshCw,
  Trophy,
  Users,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSound } from "../../hooks/useSound";
import { ChatContainer, type ChatMessageData } from "./ChatPanel";
import { ConnectionLostModal } from "./ConnectionStatus";
import { DisconnectedPlayersBanner, ToastContainer } from "./ConnectionUI";
import {
  GameStateHUD,
  type GameAction,
  type GameActionType,
} from "./GameStateHUD";
import { GameControls, PlayArea } from "./PlayArea";
import { OpponentHand, PlayerHand } from "./PlayerHand";

interface GamePlayViewProps {
  roomCode: string;
}

// Stable empty array to prevent infinite loop
const EMPTY_PLAYERS: never[] = [];

/**
 * Full Game Play View - Integrates waiting room and actual gameplay
 */
export function GamePlayView({ roomCode }: GamePlayViewProps) {
  const searchParams = useSearchParams();
  const isHostParam = searchParams.get("host") === "true";
  const { user, hasHydrated } = useUserStore();

  // Peer store
  const {
    createRoom,
    joinRoom,
    setReady,
    cleanup,
    peerId,
    broadcastToAll,
    connections,
    setOnGameMessage,
    setOnPlayerReconnect,
    setRoomStatus,
  } = usePeerStore();
  const connectionStatus = usePeerStore((s) => s.connectionStatus);
  const players = usePeerStore((s) => s.room?.players ?? EMPTY_PLAYERS);
  const isHost = usePeerStore((s) => s.room?.isHost ?? false);
  const peerError = usePeerStore((s) => s.error);

  // Game store
  const {
    phase,
    players: gamePlayers,
    currentHand,
    discardPile,
    isFirstTurn,
    initializeGame,
    playCards: gamePlayCards,
    pass: gamePass,
    applyRemotePlay,
    applyRemotePass,
    canPlayCards,
    canPass,
  } = useGameStore();

  // Sound effects
  const {
    enabled: soundEnabled,
    bgmPlaying,
    gameBgmStyle,
    toggleSound,
    toggleBgm,
    startGameBgm,
    stopBgm,
    setGameBgmStyle,
    playCardPlay,
    playCardSelect,
    playPass,
    playTurnStart,
    playWin,
    playGameStart,
    playPlayerJoin,
    playPlayerReady,
    playClick,
  } = useSound();

  // Local state
  const [copied, setCopied] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [gameStarted, setGameStarted] = useState(false);
  const [roomNotFound, setRoomNotFound] = useState(false);
  const [connectionTimeout, setConnectionTimeout] = useState(false);
  const [gameActions, setGameActions] = useState<GameAction[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessageData[]>([]);

  // AI mode state
  const [aiModeEnabled, setAiModeEnabled] = useState(false);
  const [aiDifficulty, setAiDifficulty] = useState<AIDifficulty>("medium");
  const aiTurnInProgress = useRef(false);

  // Connection store
  const {
    disconnectedPlayers,
    startHeartbeat,
    stopHeartbeat,
    startClientHeartbeat,
    stopClientHeartbeat,
    hostConnectionStatus,
    registerPlayer,
    addToast,
    reset: resetConnection,
  } = useConnectionStore();

  // Get my player info
  const myPlayerId = user?.id;
  const myGamePlayer = gamePlayers.find((p) => p.id === myPlayerId);
  const myHand = myGamePlayer?.hand ?? [];
  const isMyTurn = myGamePlayer?.isCurrentTurn ?? false;

  // Get current turn player info
  const currentTurnPlayer = gamePlayers.find((p) => p.isCurrentTurn);
  const roundNumber = useGameStore((s) => s.roundNumber);

  // Helper to add game action to history
  const addGameAction = useCallback(
    (
      playerId: string,
      action: GameActionType,
      cards?: Card[],
      message?: string
    ) => {
      const player = gamePlayers.find((p) => p.id === playerId);
      if (!player) return;

      setGameActions((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          playerId,
          playerName: player.name,
          playerAvatar: player.avatar,
          action,
          cards: cards?.map((c) => ({ suit: c.suit, rank: c.rank })),
          message,
          timestamp: Date.now(),
        },
      ]);
    },
    [gamePlayers]
  );

  // Add system game action (no specific player)
  const addSystemAction = useCallback(
    (action: GameActionType, message: string) => {
      setGameActions((prev) => [
        ...prev,
        {
          id: `${Date.now()}-${Math.random()}`,
          playerId: "system",
          playerName: "ระบบ",
          playerAvatar: "🎮",
          action,
          message,
          timestamp: Date.now(),
        },
      ]);
    },
    []
  );

  // Play sound when game starts
  const prevGameStarted = useRef(false);
  useEffect(() => {
    if (gameStarted && !prevGameStarted.current) {
      playGameStart();
    }
    prevGameStarted.current = gameStarted;
  }, [gameStarted, playGameStart]);

  // Play sound when it's my turn
  const prevIsMyTurn = useRef(false);
  useEffect(() => {
    if (isMyTurn && !prevIsMyTurn.current && gameStarted) {
      playTurnStart();
    }
    prevIsMyTurn.current = isMyTurn;
  }, [isMyTurn, gameStarted, playTurnStart]);

  // Play sound when I win (finish first)
  useEffect(() => {
    if (!myPlayerId || !gameStarted) return;
    const myPlayer = gamePlayers.find((p) => p.id === myPlayerId);
    if (myPlayer?.finishOrder === 1) {
      playWin();
    }
  }, [gamePlayers, myPlayerId, gameStarted, playWin]);

  // Play sound when player joins waiting room
  const prevPlayerCount = useRef(0);
  useEffect(() => {
    if (gameStarted) return; // Only in waiting room
    if (
      players.length > prevPlayerCount.current &&
      prevPlayerCount.current > 0
    ) {
      playPlayerJoin();
    }
    prevPlayerCount.current = players.length;
  }, [players.length, gameStarted, playPlayerJoin]);

  // Auto-start BGM when entering waiting room or game
  const bgmAutoStarted = useRef(false);
  useEffect(() => {
    // Auto-start BGM when players join (waiting room or game)
    if (players.length > 0 && !bgmAutoStarted.current) {
      startGameBgm();
      bgmAutoStarted.current = true;
    }
  }, [players.length, startGameBgm]);

  // Stop BGM only when unmounting
  useEffect(() => {
    return () => {
      stopBgm();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Initialize P2P connection
  useEffect(() => {
    if (!user || !hasHydrated || isConnecting) return;

    let timeoutId: NodeJS.Timeout | null = null;

    const initConnection = async () => {
      setIsConnecting(true);
      setRoomNotFound(false);
      setConnectionTimeout(false);

      const peerPlayer = {
        peerId: "",
        id: user.id,
        name: user.name,
        avatar: user.avatar,
        isHost: isHostParam,
        isReady: false,
        isConnected: true,
      };

      if (isHostParam) {
        createRoom(roomCode, peerPlayer);
      } else {
        // Set timeout for joining room (10 seconds)
        timeoutId = setTimeout(() => {
          const currentStatus = usePeerStore.getState().connectionStatus;
          if (currentStatus !== "connected") {
            setConnectionTimeout(true);
            setRoomNotFound(true);
            cleanup();
          }
        }, 10000);

        const success = await joinRoom(roomCode, peerPlayer);

        if (!success) {
          setRoomNotFound(true);
          if (timeoutId) clearTimeout(timeoutId);
        }
      }
    };

    initConnection();

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, hasHydrated, roomCode, isHostParam]);

  // Register game message handler
  useEffect(() => {
    const handleGameMessage = (message: PeerMessage) => {
      console.log("[GamePlayView] Received game message:", message.type);

      switch (message.type) {
        case "deal_cards": {
          const dealMsg = message as DealCardsMessage;
          const {
            hand,
            playerIndex,
            startingPlayerIndex,
            allHandCounts,
            allPlayers: msgAllPlayers,
          } = dealMsg;

          // Initialize game with players if not already done
          if (phase !== "playing") {
            // Use allPlayers from message if available (includes AI players)
            // Otherwise fallback to local players list
            const playerInfos = msgAllPlayers
              ? msgAllPlayers.map((p) => ({
                  id: p.id,
                  name: p.name,
                  avatar: p.avatar,
                  isAI: p.isAI ?? false,
                }))
              : players.map((p) => ({
                  id: p.id,
                  name: p.name,
                  avatar: p.avatar,
                }));
            initializeGame(playerInfos);
          }

          // Update game store with dealt hand
          // For own hand: use actual cards
          // For others: create dummy array with correct length
          useGameStore.setState((state) => {
            const updatedPlayers = state.players.map((player, index) => {
              const cardCount = allHandCounts?.[index] ?? 13;

              // Create dummy cards for other players (just for card count)
              const dummyHand: Card[] = Array.from(
                { length: cardCount },
                (_, i) => ({
                  id: `dummy-${index}-${i}`,
                  suit: "spade",
                  rank: "A",
                  value: 14,
                  suitValue: 4, // Spades
                })
              );

              return {
                ...player,
                // Own hand gets real cards, others get dummy cards for count
                hand: index === playerIndex ? sortCards(hand) : dummyHand,
                isCurrentTurn: index === startingPlayerIndex,
              };
            });

            return {
              ...state,
              phase: "playing",
              players: updatedPlayers,
              currentPlayerIndex: startingPlayerIndex,
              isFirstTurn: true,
              roundNumber: 1,
            };
          });

          setGameStarted(true);

          // Add game start logs with delays for CLIENT
          const playerCount = useGameStore.getState().players.length;
          const cardsPerPlayer = allHandCounts?.[0] ?? 13;
          const startingPlayer =
            useGameStore.getState().players[startingPlayerIndex];

          // Step 1: เริ่มเกม
          addSystemAction("game_starting", "🎮 เริ่มเกม!");

          // Step 2: กำลังแจกไพ่ (หน่วง 1 วิ)
          setTimeout(() => {
            addSystemAction("dealing_cards", "🃏 กำลังแจกไพ่...");
          }, 1000);

          // Step 3: รายละเอียดแจกไพ่ (หน่วง 2 วิ)
          setTimeout(() => {
            addSystemAction(
              "deal_complete",
              `✅ แจกไพ่เรียบร้อย! ${playerCount} ผู้เล่น คนละ ${cardsPerPlayer} ใบ`
            );
          }, 2000);

          // Step 4: ถึงตาใคร (หน่วง 3 วิ)
          setTimeout(() => {
            if (startingPlayer) {
              addGameAction(
                startingPlayer.id,
                "turn_change",
                undefined,
                `🎯 ถึงตา ${startingPlayer.name} (มี 3♣️)`
              );
            }
          }, 3000);
          break;
        }

        case "play_cards": {
          // Handle other player's card play (use remote apply - no validation)
          const playMsg = message as PlayCardsMessage;
          applyRemotePlay(playMsg.playerId, playMsg.cards, playMsg.playedHand);
          // Add to history
          addGameAction(playMsg.playerId, "play", playMsg.cards);
          break;
        }

        case "pass_turn": {
          // Handle other player's pass (use remote apply - no validation)
          const passMsg = message as PassTurnMessage;
          applyRemotePass(passMsg.playerId);
          // Add to history
          addGameAction(passMsg.playerId, "pass");
          break;
        }

        case "new_round": {
          // Host wants to start a new round - reset local state
          console.log("[GamePlayView] New round received");
          addSystemAction("new_round", "🎴 เริ่มเกมรอบใหม่!");
          useGameStore.getState().resetRound();
          break;
        }

        case "sync_request": {
          // Client is requesting sync - host handles this
          if (!usePeerStore.getState().room?.isHost) break;

          const syncReq =
            message as import("@/src/domain/types/peer").SyncRequestMessage;
          const gameState = useGameStore.getState();
          const conn = usePeerStore
            .getState()
            .connections.get(syncReq.senderId);

          // Find the requesting player to get their hand
          const requestingPlayer = gameState.players.find(
            (p) => p.id === syncReq.playerId
          );

          if (conn?.open && requestingPlayer) {
            console.log(
              "[GamePlayView] Sending sync_game_state to:",
              syncReq.playerId,
              "hand size:",
              requestingPlayer.hand.length
            );

            conn.send({
              type: "sync_game_state" as const,
              senderId: usePeerStore.getState().peerId!,
              timestamp: Date.now(),
              hand: requestingPlayer.hand, // Send their actual hand
              gameState: {
                phase: gameState.phase,
                currentPlayerIndex: gameState.currentPlayerIndex,
                roundNumber: gameState.roundNumber,
                finishOrder: gameState.finishOrder,
                lastPlayerId: gameState.lastPlayerId,
                passCount: gameState.passCount,
                isFirstTurn: gameState.isFirstTurn,
                currentHand: gameState.currentHand,
              },
              discardPile: gameState.discardPile,
              allPlayers: gameState.players.map((p) => ({
                id: p.id,
                name: p.name,
                avatar: p.avatar,
                handCount: p.hand.length,
                hasPassed: p.hasPassed,
                isCurrentTurn: p.isCurrentTurn,
                finishOrder: p.finishOrder ?? undefined,
                isAI: p.isAI ?? false,
              })),
            });
            addToast("info", `Sync ข้อมูลให้ ${requestingPlayer.name} แล้ว`);
          }
          break;
        }

        case "sync_game_state": {
          // Host sent us the current game state - apply it!
          const syncMsg =
            message as import("@/src/domain/types/peer").SyncGameStateMessage;
          console.log(
            "[GamePlayView] Received sync game state, hand size:",
            syncMsg.hand?.length
          );

          // Restore game state similar to resume_game
          useGameStore.setState((state) => {
            // Build player info from sync data
            const restoredPlayers = syncMsg.allPlayers.map((p, idx) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              isAI: p.isAI ?? false,
              hand:
                p.id === myPlayerId
                  ? syncMsg.hand // Use actual hand for this player
                  : Array.from({ length: p.handCount }, (_, i) => ({
                      id: `dummy-${p.id}-${i}`,
                      suit: "spade" as const,
                      rank: "A" as const,
                      value: 14,
                      suitValue: 4,
                    })), // Dummy cards for other players (only count matters)
              hasPassed: p.hasPassed,
              isCurrentTurn: p.isCurrentTurn,
              finishOrder: p.finishOrder ?? null,
              score: state.players[idx]?.score ?? 0,
              roundScore: state.players[idx]?.roundScore ?? 0,
              rank: state.players[idx]?.rank ?? null,
            }));

            return {
              phase: syncMsg.gameState.phase as
                | "waiting"
                | "dealing"
                | "playing"
                | "round_end"
                | "game_end",
              currentPlayerIndex: syncMsg.gameState.currentPlayerIndex,
              roundNumber: syncMsg.gameState.roundNumber,
              finishOrder: syncMsg.gameState.finishOrder,
              lastPlayerId: syncMsg.gameState.lastPlayerId,
              passCount: syncMsg.gameState.passCount,
              isFirstTurn: syncMsg.gameState.isFirstTurn,
              currentHand: syncMsg.gameState.currentHand,
              discardPile: syncMsg.discardPile,
              players: restoredPlayers,
            };
          });

          setIsSyncing(false);
          addToast("success", "Sync สำเร็จ!");
          console.log("[GamePlayView] Game state restored from sync");
          break;
        }

        case "player_disconnected": {
          const dcMsg =
            message as import("@/src/domain/types/peer").PlayerDisconnectedMessage;
          addToast("warning", `${dcMsg.playerName} หลุดออกไป`);
          break;
        }

        case "player_reconnected": {
          const rcMsg =
            message as import("@/src/domain/types/peer").PlayerReconnectedMessage;
          addToast("success", `${rcMsg.playerName} กลับมาแล้ว`);
          break;
        }

        case "resume_game": {
          // Handle game resume after reconnection (client side)
          const resumeMsg =
            message as import("@/src/domain/types/peer").ResumeGameMessage;
          console.log("[GamePlayView] Resuming game after reconnect");

          // Restore game state
          useGameStore.setState((state) => {
            // Build player hands from resume data
            const restoredPlayers = resumeMsg.allPlayers.map((p, idx) => ({
              id: p.id,
              name: p.name,
              avatar: p.avatar,
              hand:
                p.name === user?.name
                  ? resumeMsg.hand
                  : Array.from({ length: p.handCount }, (_, i) => ({
                      id: `dummy-${p.id}-${i}`,
                      suit: "spade" as const,
                      rank: "A" as const,
                      value: 14,
                      suitValue: 4,
                    })), // Dummy cards for other players (only count matters)
              hasPassed: p.hasPassed,
              isCurrentTurn: p.isCurrentTurn,
              finishOrder: p.finishOrder ?? null,
              score: state.players[idx]?.score ?? 0,
              roundScore: state.players[idx]?.roundScore ?? 0,
              rank: state.players[idx]?.rank ?? null,
            }));

            return {
              phase: resumeMsg.gameState.phase as
                | "waiting"
                | "dealing"
                | "playing"
                | "round_end"
                | "game_end",
              currentPlayerIndex: resumeMsg.gameState.currentPlayerIndex,
              roundNumber: resumeMsg.gameState.roundNumber,
              finishOrder: resumeMsg.gameState.finishOrder,
              lastPlayerId: resumeMsg.gameState.lastPlayerId,
              passCount: resumeMsg.gameState.passCount,
              isFirstTurn: resumeMsg.gameState.isFirstTurn,
              currentHand: resumeMsg.gameState.currentHand,
              discardPile: resumeMsg.discardPile,
              players: restoredPlayers,
            };
          });

          // Mark game as started
          setGameStarted(true);
          addToast("success", "กลับเข้าเกมสำเร็จ!");
          addSystemAction("new_round", "🔄 กลับเข้าเกมแล้ว");
          break;
        }

        case "chat": {
          const chatMsg =
            message as import("@/src/domain/types/peer").ChatMessage;
          setChatMessages((prev) => [
            ...prev,
            {
              id: `${chatMsg.timestamp}-${chatMsg.senderId}`,
              senderId: chatMsg.senderId,
              playerName: chatMsg.playerName,
              message: chatMsg.message,
              timestamp: chatMsg.timestamp,
            },
          ]);
          break;
        }

        default:
          console.log("[GamePlayView] Unhandled game message:", message.type);
      }
    };

    setOnGameMessage(handleGameMessage);

    return () => {
      setOnGameMessage(null);
    };
  }, [
    players,
    phase,
    user,
    myPlayerId,
    initializeGame,
    applyRemotePlay,
    applyRemotePass,
    setOnGameMessage,
    addGameAction,
    addSystemAction,
    addToast,
  ]);

  // Track finish order to add game logs when players finish
  const finishOrder = useGameStore((s) => s.finishOrder);
  const [prevFinishOrder, setPrevFinishOrder] = useState<string[]>([]);

  useEffect(() => {
    // Check for new finishers
    if (finishOrder.length > prevFinishOrder.length) {
      const newFinishers = finishOrder.slice(prevFinishOrder.length);
      newFinishers.forEach((playerId, index) => {
        const position = prevFinishOrder.length + index + 1;
        const rankNames = ["👑 King", "🎖️ Noble", "👤 Commoner", "⛓️ Slave"];
        const rankName = rankNames[position - 1] || "ออก";

        const player = gamePlayers.find((p) => p.id === playerId);
        if (player) {
          addGameAction(
            playerId,
            "player_finish",
            undefined,
            `ไพ่หมดแล้ว! ได้ ${rankName}`
          );
        }
      });
    }
    setPrevFinishOrder(finishOrder);
  }, [finishOrder, prevFinishOrder, gamePlayers, addGameAction]);

  // Track round number to add game logs when round resets
  // Start from -1 to skip the initial round (1)
  const [prevRoundNumber, setPrevRoundNumber] = useState(-1);

  useEffect(() => {
    // Skip if this is the first time (game just started)
    // Only log when round changes AFTER the game has been running
    if (
      prevRoundNumber > 0 &&
      roundNumber > prevRoundNumber &&
      phase === "playing"
    ) {
      // Find the last player who played
      const lastPlayerId = useGameStore.getState().lastPlayerId;
      if (lastPlayerId) {
        const player = gamePlayers.find((p) => p.id === lastPlayerId);
        if (player) {
          addGameAction(
            lastPlayerId,
            "round_reset",
            undefined,
            `ทุกคนผ่าน - ${player.name} ลงไพ่ใหม่`
          );
        }
      }
    }
    setPrevRoundNumber(roundNumber);
  }, [roundNumber, prevRoundNumber, phase, gamePlayers, addGameAction]);

  // Track game end
  useEffect(() => {
    if (phase === "game_end") {
      addSystemAction("game_end", "🎊 เกมจบแล้ว! ดูผลคะแนน");
    }
  }, [phase, addSystemAction]);

  // Track turn changes (skip first turn as it's logged in deal_cards)
  const [prevTurnPlayerId, setPrevTurnPlayerId] = useState<string | null>(null);
  const [hasDoneFirstTurn, setHasDoneFirstTurn] = useState(false);

  useEffect(() => {
    if (phase !== "playing") return;

    const currentTurnId = currentTurnPlayer?.id;
    if (!currentTurnId) return;

    // Skip if same player
    if (currentTurnId === prevTurnPlayerId) return;

    // Skip first turn (already logged in deal_cards)
    if (!hasDoneFirstTurn) {
      setHasDoneFirstTurn(true);
      setPrevTurnPlayerId(currentTurnId);
      return;
    }

    // Log turn change
    addGameAction(
      currentTurnId,
      "turn_change",
      undefined,
      `ถึงตา ${currentTurnPlayer.name}`
    );
    setPrevTurnPlayerId(currentTurnId);
  }, [
    currentTurnPlayer,
    prevTurnPlayerId,
    hasDoneFirstTurn,
    phase,
    addGameAction,
  ]);

  // Initialize heartbeat for host
  useEffect(() => {
    if (!isHost || !gameStarted) return;

    // Register all players for heartbeat tracking
    players.forEach((player) => {
      if (player.peerId !== peerId) {
        registerPlayer(player.peerId, player.id, player.name);
      }
    });

    // Start heartbeat
    startHeartbeat(
      // Send ping function
      (targetPeerId: string) => {
        const conn = connections.get(targetPeerId);
        if (conn?.open) {
          conn.send({
            type: "ping",
            senderId: peerId!,
            timestamp: Date.now(),
          });
        }
      },
      // On player disconnect function
      (targetPeerId: string, playerName: string) => {
        console.log(`[Heartbeat] Player ${playerName} disconnected`);
        // Broadcast disconnection to all other players
        broadcastToAll({
          type: "player_disconnected" as const,
          senderId: peerId!,
          timestamp: Date.now(),
          playerId: players.find((p) => p.peerId === targetPeerId)?.id || "",
          playerName,
        });
      }
    );

    return () => {
      stopHeartbeat();
    };
  }, [
    isHost,
    gameStarted,
    players,
    peerId,
    connections,
    registerPlayer,
    startHeartbeat,
    stopHeartbeat,
    broadcastToAll,
  ]);

  // Initialize client heartbeat (non-host only) - track connection to host
  // Only active during "playing" phase to avoid false disconnection during game_end/round_end
  useEffect(() => {
    // Only non-host players use client heartbeat, and only during active play
    if (isHost || !gameStarted || phase !== "playing") {
      // Stop heartbeat if conditions not met (e.g., game ended)
      stopClientHeartbeat();
      return;
    }

    console.log(
      "[GamePlayView] Starting client heartbeat for host connection tracking"
    );

    // Request sync from host
    const requestSyncFromHost = () => {
      const hostConn = usePeerStore.getState().hostConnection;
      if (hostConn?.open) {
        console.log(
          "[GamePlayView] Requesting sync from host due to stale connection"
        );
        hostConn.send({
          type: "sync_request" as const,
          senderId: peerId!,
          timestamp: Date.now(),
          playerId: myPlayerId!,
        });
      }
    };

    // On connection stale/disconnected
    const onConnectionStale = () => {
      console.log(
        "[GamePlayView] Connection to host appears stale/disconnected"
      );
      // The toast will be shown by connectionStore
      // Could add additional logic here like auto-refresh prompt
    };

    startClientHeartbeat(requestSyncFromHost, onConnectionStale);

    return () => {
      stopClientHeartbeat();
    };
  }, [
    isHost,
    gameStarted,
    phase,
    peerId,
    myPlayerId,
    startClientHeartbeat,
    stopClientHeartbeat,
  ]);

  // Setup onPlayerReconnect callback (host sends resume_game)
  useEffect(() => {
    if (!isHost) return;

    const handlePlayerReconnect = (
      playerId: string,
      playerPeerId: string,
      playerName: string
    ) => {
      console.log(
        `[GamePlayView] Player reconnected: ${playerName} (${playerId})`
      );

      const gameState = useGameStore.getState();

      // Find player by ID first, then by name as fallback
      let playerIndex = gameState.players.findIndex((p) => p.id === playerId);
      if (playerIndex < 0) {
        playerIndex = gameState.players.findIndex((p) => p.name === playerName);
      }

      const player = gameState.players[playerIndex];

      if (!player) {
        console.error(
          "[GamePlayView] Player not found for reconnect:",
          playerName,
          playerId
        );
        return;
      }

      console.log(
        `[GamePlayView] Found player at index ${playerIndex}:`,
        player.name
      );

      // Build resume message
      const resumeMessage = {
        type: "resume_game" as const,
        senderId: peerId!,
        timestamp: Date.now(),
        hand: player.hand,
        playerIndex,
        gameState: {
          phase: gameState.phase,
          currentPlayerIndex: gameState.currentPlayerIndex,
          roundNumber: gameState.roundNumber,
          finishOrder: gameState.finishOrder,
          lastPlayerId: gameState.lastPlayerId,
          passCount: gameState.passCount,
          isFirstTurn: gameState.isFirstTurn,
          currentHand: gameState.currentHand,
        },
        discardPile: gameState.discardPile,
        allPlayers: gameState.players.map((p) => ({
          id: p.id,
          name: p.name,
          avatar: p.avatar,
          handCount: p.hand.length,
          hasPassed: p.hasPassed,
          isCurrentTurn: p.isCurrentTurn,
          finishOrder: p.finishOrder ?? undefined,
        })),
      };

      // Send to reconnecting player (delay to ensure client has setup handler)
      const conn = connections.get(playerPeerId);
      if (conn?.open) {
        // Delay to allow client to setup message handler
        setTimeout(() => {
          if (conn.open) {
            conn.send(resumeMessage);
            addToast("info", `ส่งข้อมูลเกมให้ ${player.name} แล้ว`);
          }
        }, 500);
      }
    };

    setOnPlayerReconnect(handlePlayerReconnect);

    return () => {
      setOnPlayerReconnect(null);
    };
  }, [isHost, peerId, connections, setOnPlayerReconnect, addToast]);

  // Cleanup connection store on unmount
  useEffect(() => {
    return () => {
      resetConnection();
    };
  }, [resetConnection]);

  // Request sync from host (client only)
  const requestSync = useCallback(() => {
    if (isHost) return;

    const hostConn = usePeerStore.getState().hostConnection;
    if (hostConn?.open) {
      setIsSyncing(true);
      hostConn.send({
        type: "sync_request" as const,
        senderId: peerId!,
        timestamp: Date.now(),
        playerId: myPlayerId!,
      });

      // Timeout for sync
      setTimeout(() => {
        setIsSyncing(false);
      }, 3000);
    }
  }, [isHost, peerId, myPlayerId]);

  // Send chat message
  const sendChatMessage = useCallback(
    (message: string) => {
      if (!user || !peerId) return;

      const chatMessage = {
        type: "chat" as const,
        senderId: peerId,
        timestamp: Date.now(),
        message,
        playerName: user.name,
      };

      // Add to own chat immediately
      setChatMessages((prev) => [
        ...prev,
        {
          id: `${chatMessage.timestamp}-${chatMessage.senderId}`,
          senderId: chatMessage.senderId,
          playerName: chatMessage.playerName,
          message: chatMessage.message,
          timestamp: chatMessage.timestamp,
        },
      ]);

      // Send to others
      if (isHost) {
        // Host broadcasts to all
        broadcastToAll(chatMessage);
      } else {
        // Client sends to host (host will relay)
        const hostConn = usePeerStore.getState().hostConnection;
        if (hostConn?.open) {
          hostConn.send(chatMessage);
        }
      }
    },
    [user, peerId, isHost, broadcastToAll]
  );

  // Track which AI is currently processing and which round to detect turn changes
  const lastAIProcessingId = useRef<string | null>(null);
  const lastProcessedRound = useRef<number>(-1);

  // AI Turn Handler - automatically plays for AI players
  useEffect(() => {
    // Only host handles AI turns
    if (!isHost || !gameStarted || phase !== "playing") return;

    // Use roundNumber from component state (in dependency array)
    const currentRound = roundNumber;

    // Find current turn player
    const currentPlayer = gamePlayers.find((p) => p.isCurrentTurn);
    if (!currentPlayer) return;

    // Check if current player is AI
    if (!currentPlayer.isAI || isAIPlayer(currentPlayer.id) === false) {
      // Reset if it's now a human's turn
      aiTurnInProgress.current = false;
      lastAIProcessingId.current = null;
      return;
    }

    // Skip if AI has already finished (no cards left)
    if (currentPlayer.hand.length === 0 || currentPlayer.finishOrder !== null) {
      console.log(
        `AI ${currentPlayer.id} has finished, skipping turn and calling nextTurn`
      );
      aiTurnInProgress.current = false;
      // Force next turn to skip this finished player
      useGameStore.getState().nextTurn();
      return;
    }

    // Reset lock if:
    // 1. Different AI's turn now
    // 2. Same AI but different round (round reset - everyone passed back to this AI)
    const shouldResetLock =
      (lastAIProcessingId.current !== null &&
        lastAIProcessingId.current !== currentPlayer.id) ||
      (lastAIProcessingId.current === currentPlayer.id &&
        lastProcessedRound.current !== currentRound);

    if (shouldResetLock) {
      console.log(
        `AI turn reset: player=${currentPlayer.id}, round=${currentRound}, prevRound=${lastProcessedRound.current}`
      );
      aiTurnInProgress.current = false;
    }

    // Prevent multiple AI turns at once
    if (aiTurnInProgress.current) return;

    aiTurnInProgress.current = true;
    lastAIProcessingId.current = currentPlayer.id;
    lastProcessedRound.current = currentRound;

    // Delay AI move for realism
    const thinkingDelay = DEFAULT_AI_CONFIG.thinkingDelayMs;

    const timeoutId = setTimeout(() => {
      // Get FRESH state when making decision (important after round resets)
      const freshState = useGameStore.getState();
      const aiPlayer = freshState.players.find(
        (p) => p.id === currentPlayer.id
      );

      // Check if it's still AI's turn (state might have changed)
      if (!aiPlayer?.isCurrentTurn) {
        aiTurnInProgress.current = false;
        return;
      }

      const aiHand = aiPlayer.hand;
      const currentHandOnTable = freshState.currentHand;
      const isFirst = freshState.isFirstTurn;

      // Make AI decision with fresh state
      const decision = makeAIDecision(
        aiHand,
        currentHandOnTable,
        isFirst,
        aiDifficulty
      );

      if (decision.action === "play" && decision.cards && decision.playedHand) {
        // AI plays cards
        const success = useGameStore
          .getState()
          .playCards(currentPlayer.id, decision.cards);
        if (success) {
          // Add to game history
          addGameAction(currentPlayer.id, "play", decision.cards);

          // Broadcast to other players (non-AI only)
          const message = {
            type: "play_cards" as const,
            senderId: peerId!,
            timestamp: Date.now(),
            playerId: currentPlayer.id,
            cards: decision.cards,
            playedHand: decision.playedHand,
          };

          // Only send to real players (not AI)
          connections.forEach((conn, connPeerId) => {
            if (!connPeerId.startsWith("ai-peer-") && conn.open) {
              conn.send(message);
            }
          });
        }
      } else if (decision.action === "pass") {
        // AI passes - but check if pass is allowed
        const canPassNow = useGameStore.getState().canPass(currentPlayer.id);

        if (canPassNow) {
          const success = useGameStore.getState().pass(currentPlayer.id);
          if (success) {
            // Add to game history
            addGameAction(currentPlayer.id, "pass");

            // Broadcast to other players (non-AI only)
            const message = {
              type: "pass_turn" as const,
              senderId: peerId!,
              timestamp: Date.now(),
              playerId: currentPlayer.id,
            };

            connections.forEach((conn, connPeerId) => {
              if (!connPeerId.startsWith("ai-peer-") && conn.open) {
                conn.send(message);
              }
            });
          }
        } else {
          // AI tried to pass but can't (fresh round) - force play lowest card
          console.warn("AI tried to pass but can't - forcing play");
          const lowestCard = aiHand[0]; // Hand should be sorted
          if (lowestCard) {
            const forcedHand = createPlayedHand([lowestCard], currentPlayer.id);
            if (forcedHand) {
              const success = useGameStore
                .getState()
                .playCards(currentPlayer.id, [lowestCard]);
              if (success) {
                addGameAction(currentPlayer.id, "play", [lowestCard]);
                const message = {
                  type: "play_cards" as const,
                  senderId: peerId!,
                  timestamp: Date.now(),
                  playerId: currentPlayer.id,
                  cards: [lowestCard],
                  playedHand: forcedHand,
                };
                connections.forEach((conn, connPeerId) => {
                  if (!connPeerId.startsWith("ai-peer-") && conn.open) {
                    conn.send(message);
                  }
                });
              }
            }
          }
        }
      }

      aiTurnInProgress.current = false;
    }, thinkingDelay);

    return () => {
      clearTimeout(timeoutId);
      aiTurnInProgress.current = false;
    };
  }, [
    isHost,
    gameStarted,
    phase,
    gamePlayers,
    aiDifficulty,
    peerId,
    connections,
    addGameAction,
    roundNumber, // Add roundNumber to trigger when round resets
  ]);

  // Copy room code
  const copyRoomCode = async () => {
    try {
      await navigator.clipboard.writeText(roomCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  // Toggle ready
  const toggleReady = () => {
    const currentPlayer = players.find((p) => p.id === user?.id);
    if (currentPlayer) {
      playPlayerReady(); // Play ready sound
      setReady(!currentPlayer.isReady);
    }
  };

  // Start game (host only)
  const handleStartGame = useCallback(() => {
    if (!isHost) return;

    // Build player list - add AI players if needed
    const allPlayers = [...players];

    // If AI mode enabled and not enough players, add AI players
    if (aiModeEnabled && players.length < 4) {
      const aiPlayersNeeded = 4 - players.length;
      for (let i = 0; i < aiPlayersNeeded; i++) {
        allPlayers.push({
          peerId: `ai-peer-${i}`,
          id: generateAIPlayerId(i),
          name: AI_NAMES[i % AI_NAMES.length],
          avatar: AI_AVATARS[i % AI_AVATARS.length],
          isHost: false,
          isReady: true,
          isConnected: true,
          isAI: true,
        });
      }
    }

    // Must have exactly 4 players
    if (allPlayers.length !== 4) return;

    // Initialize game store
    const playerInfos = allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isAI: p.isAI ?? false,
    }));
    initializeGame(playerInfos);

    // Start the game (deals cards)
    useGameStore.getState().startGame();

    setGameStarted(true);
    setRoomStatus("playing"); // Mark room as playing for reconnection logic

    // Broadcast game state to all players
    const gameState = useGameStore.getState();

    // Get all hand counts for sending to clients
    const allHandCounts = gameState.players.map((p) => p.hand.length);

    // Add game start logs with delays for HOST
    const playerCount = gameState.players.length;
    const cardsPerPlayer = allHandCounts[0] ?? 13;
    const startingPlayer = gameState.players[gameState.currentPlayerIndex];

    // Step 1: เริ่มเกม
    addSystemAction("game_starting", "🎮 เริ่มเกม!");

    // Step 2: กำลังแจกไพ่ (หน่วง 1 วิ)
    setTimeout(() => {
      addSystemAction("dealing_cards", "🃏 กำลังแจกไพ่...");
    }, 1000);

    // Step 3: รายละเอียดแจกไพ่ (หน่วง 2 วิ)
    setTimeout(() => {
      addSystemAction(
        "deal_complete",
        `✅ แจกไพ่เรียบร้อย! ${playerCount} ผู้เล่น คนละ ${cardsPerPlayer} ใบ`
      );
    }, 2000);

    // Step 4: ถึงตาใคร (หน่วง 3 วิ)
    setTimeout(() => {
      if (startingPlayer) {
        addGameAction(
          startingPlayer.id,
          "turn_change",
          undefined,
          `🎯 ถึงตา ${startingPlayer.name} (มี 3♣️)`
        );
      }
    }, 3000);

    // Build allPlayers info for clients to initialize game correctly (including AI)
    const allPlayersInfo = allPlayers.map((p) => ({
      id: p.id,
      name: p.name,
      avatar: p.avatar,
      isAI: p.isAI ?? false,
    }));

    // Send each player their hand
    players.forEach((player) => {
      // Find the actual player index in allPlayers (which includes AI)
      const actualPlayerIndex = allPlayers.findIndex((p) => p.id === player.id);
      const hand = gameState.players[actualPlayerIndex]?.hand ?? [];
      const message = {
        type: "deal_cards" as const,
        senderId: peerId!,
        timestamp: Date.now(),
        hand,
        playerIndex: actualPlayerIndex, // Use actual index in full player list
        startingPlayerIndex: gameState.currentPlayerIndex,
        allHandCounts, // Include all hand counts
        allPlayers: allPlayersInfo, // Include all players (with AI) for client initialization
      };

      if (player.peerId === peerId) {
        // Local (host) - already has cards and logs added above
      } else {
        const conn = connections.get(player.peerId);
        if (conn?.open) {
          conn.send(message);
        }
      }
    });
  }, [
    isHost,
    players,
    peerId,
    connections,
    initializeGame,
    addSystemAction,
    addGameAction,
    setRoomStatus,
    aiModeEnabled,
  ]);

  // Handle card selection
  const handleCardSelect = (card: Card) => {
    if (!isMyTurn) return;

    playCardSelect(); // Play select sound

    setSelectedCards((prev) => {
      const isSelected = prev.some((c) => c.id === card.id);
      if (isSelected) {
        return prev.filter((c) => c.id !== card.id);
      } else {
        return [...prev, card];
      }
    });
  };

  // Play selected cards
  const handlePlay = () => {
    if (!myPlayerId || selectedCards.length === 0) return;

    // Validate
    if (!canPlayCards(myPlayerId, selectedCards)) return;

    // First turn must include 3♣
    if (isFirstTurn && !containsThreeOfClubs(selectedCards)) return;

    // Create played hand
    const playedHand = createPlayedHand(selectedCards, myPlayerId);
    if (!playedHand) return;

    // Execute play
    const success = gamePlayCards(myPlayerId, selectedCards);
    if (success) {
      playCardPlay(); // Play card sound
      // Add to game history
      addGameAction(myPlayerId, "play", selectedCards);

      // Send to other players
      const message = {
        type: "play_cards" as const,
        senderId: peerId!,
        timestamp: Date.now(),
        playerId: myPlayerId,
        cards: selectedCards,
        playedHand,
      };

      if (isHost) {
        // Host broadcasts to all clients
        broadcastToAll(message);
      } else {
        // Client sends to host (host will relay to others)
        const hostConnection = usePeerStore.getState().hostConnection;
        if (hostConnection?.open) {
          hostConnection.send(message);
        }
      }

      setSelectedCards([]);
    }
  };

  // Pass turn
  const handlePass = () => {
    if (!myPlayerId || isFirstTurn) return;

    if (!canPass(myPlayerId)) return;

    const success = gamePass(myPlayerId);
    if (success) {
      playPass(); // Play pass sound
      // Add to game history
      addGameAction(myPlayerId, "pass");

      const message = {
        type: "pass_turn" as const,
        senderId: peerId!,
        timestamp: Date.now(),
        playerId: myPlayerId,
      };

      if (isHost) {
        // Host broadcasts to all clients
        broadcastToAll(message);
      } else {
        // Client sends to host (host will relay to others)
        const hostConnection = usePeerStore.getState().hostConnection;
        if (hostConnection?.open) {
          hostConnection.send(message);
        }
      }
    }
  };

  // Check if can play selected cards
  const canPlaySelected =
    myPlayerId &&
    selectedCards.length > 0 &&
    canPlayCards(myPlayerId, selectedCards) &&
    (!isFirstTurn || containsThreeOfClubs(selectedCards));

  // Check all players ready
  // If AI mode is enabled, allow starting with less than 4 players (AI will fill in)
  const allPlayersReady = aiModeEnabled
    ? players.length >= 1 && players.every((p) => p.isReady)
    : players.length === 4 && players.every((p) => p.isReady);

  // Can start game check - different for AI mode
  const canStartGame = aiModeEnabled
    ? players.length >= 1 &&
      players.length <= 4 &&
      players.every((p) => p.isReady)
    : players.length === 4 && players.every((p) => p.isReady);

  // Loading state
  if (!hasHydrated) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-red-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-400">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  // No user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8">
          <div className="text-6xl mb-4">👤</div>
          <h1 className="text-2xl font-bold text-white mb-2">
            ยังไม่มีโปรไฟล์
          </h1>
          <p className="text-gray-400 mb-6">สร้างโปรไฟล์ก่อนเข้าร่วมเกม</p>
          <Link
            href="/profile"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium"
          >
            สร้างโปรไฟล์
          </Link>
        </div>
      </div>
    );
  }

  // Room not found (invalid room code)
  if (roomNotFound || (connectionStatus === "error" && !isHostParam)) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center p-8 max-w-md">
          <div className="w-20 h-20 rounded-full bg-red-500/20 flex items-center justify-center mx-auto mb-6">
            <WifiOff className="w-10 h-10 text-red-400" />
          </div>
          <h1 className="text-2xl font-bold text-white mb-2">ไม่พบห้อง</h1>
          <p className="text-gray-400 mb-2">
            รหัสห้อง <span className="font-mono text-white">{roomCode}</span>{" "}
            ไม่ถูกต้อง
          </p>
          <p className="text-gray-500 text-sm mb-6">
            {connectionTimeout
              ? "หมดเวลาการเชื่อมต่อ - ห้องอาจไม่มีอยู่หรือปิดไปแล้ว"
              : peerError || "ห้องอาจไม่มีอยู่ หรือเจ้าของห้องออกไปแล้ว"}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/lobby"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              กลับไปห้องรอ
            </Link>
            <Link
              href="/"
              className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              หน้าแรก
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Game in progress
  if (gameStarted && phase === "playing") {
    // Get opponent indices (relative to my position)
    const myIndex = gamePlayers.findIndex((p) => p.id === myPlayerId);
    const leftIndex = (myIndex + 1) % 4;
    const topIndex = (myIndex + 2) % 4;
    const rightIndex = (myIndex + 3) % 4;

    const leftPlayer = gamePlayers[leftIndex];
    const topPlayer = gamePlayers[topIndex];
    const rightPlayer = gamePlayers[rightIndex];

    return (
      <div className="h-svh bg-linear-to-b from-green-900 to-green-950 flex flex-col overflow-x-hidden overflow-y-hidden">
        {/* Compact Header */}
        <header className="shrink-0 border-b border-green-800 bg-green-900/80 backdrop-blur-md">
          <div className="container mx-auto px-2 md:px-4 py-1.5 md:py-2">
            <div className="flex items-center justify-between">
              <Link
                href="/lobby"
                className="flex items-center gap-1 text-green-300 hover:text-white text-sm"
              >
                <ArrowLeft className="w-4 h-4" />
              </Link>

              <button
                onClick={copyRoomCode}
                className="flex items-center gap-1.5 px-2 py-1 rounded bg-green-800 hover:bg-green-700"
              >
                <span className="font-mono font-bold text-white text-sm">
                  {roomCode}
                </span>
                <Copy
                  className={`w-3.5 h-3.5 ${
                    copied ? "text-green-400" : "text-green-500"
                  }`}
                />
              </button>

              <div className="flex items-center gap-2">
                {/* Sound toggle */}
                <button
                  onClick={toggleSound}
                  className="p-1 rounded hover:bg-green-800 transition-colors"
                  title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
                >
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4 text-green-400" />
                  ) : (
                    <VolumeX className="w-4 h-4 text-gray-500" />
                  )}
                </button>
                {/* BGM Style Selector */}
                <select
                  value={bgmPlaying ? gameBgmStyle : "off"}
                  onChange={(e) => {
                    if (e.target.value === "off") {
                      stopBgm();
                    } else {
                      setGameBgmStyle(e.target.value as typeof gameBgmStyle);
                      if (!bgmPlaying) startGameBgm();
                    }
                  }}
                  className="bg-green-800 text-white text-xs rounded px-1.5 py-0.5 border-none outline-none cursor-pointer"
                  title="เลือก BGM"
                >
                  <option value="off">🔇 ปิด</option>
                  <option value="adventure">🗺️ ผจญภัย</option>
                  <option value="battle">⚔️ ต่อสู้</option>
                  <option value="castle">🏰 ปราสาท</option>
                  <option value="tavern">🍺 โรงเตี๊ยม</option>
                  <option value="tension">😰 ตึงเครียด</option>
                </select>
                {/* Connection status indicator with inline sync */}
                <div className="flex items-center gap-1">
                  {!isHost && (
                    <button
                      onClick={requestSync}
                      disabled={isSyncing}
                      className={cn(
                        "p-1 rounded transition-colors",
                        isSyncing
                          ? "text-gray-500"
                          : hostConnectionStatus === "connected"
                          ? "text-green-400 hover:bg-green-800"
                          : "text-yellow-400 hover:bg-yellow-800 animate-pulse"
                      )}
                      title={
                        isSyncing
                          ? "กำลัง Sync..."
                          : hostConnectionStatus === "connected"
                          ? "Sync State"
                          : "การเชื่อมต่อไม่เสถียร - กด Sync"
                      }
                    >
                      <RefreshCw
                        className={cn("w-4 h-4", isSyncing && "animate-spin")}
                      />
                    </button>
                  )}
                  <div
                    className="p-1"
                    title={
                      isHost
                        ? "Host"
                        : hostConnectionStatus === "connected"
                        ? "เชื่อมต่อปกติ"
                        : hostConnectionStatus === "stale"
                        ? "การเชื่อมต่อไม่เสถียร"
                        : "หลุดการเชื่อมต่อ"
                    }
                  >
                    {isHost ? (
                      <Wifi className="w-4 h-4 text-green-400" />
                    ) : hostConnectionStatus === "connected" ? (
                      <Wifi className="w-4 h-4 text-green-400" />
                    ) : hostConnectionStatus === "stale" ? (
                      <Wifi className="w-4 h-4 text-yellow-400 animate-pulse" />
                    ) : (
                      <WifiOff className="w-4 h-4 text-red-400 animate-pulse" />
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Game State HUD - More compact on mobile */}
        <GameStateHUD
          currentPlayerName={currentTurnPlayer?.name ?? ""}
          currentPlayerAvatar={currentTurnPlayer?.avatar ?? ""}
          isMyTurn={isMyTurn}
          actions={gameActions}
          roundNumber={roundNumber}
        />

        {/* Game Area - Fixed height with better mobile positioning */}
        <main className="flex-1 relative min-h-0 overflow-visible">
          {/* Top opponent - positioned higher on mobile */}
          {topPlayer && (
            <div className="absolute top-1 md:top-4 left-1/2 -translate-x-1/2">
              <OpponentHand
                cardCount={topPlayer.hand.length}
                playerName={topPlayer.name}
                avatar={topPlayer.avatar}
                isCurrentTurn={topPlayer.isCurrentTurn}
                hasPassed={topPlayer.hasPassed}
                finishOrder={topPlayer.finishOrder}
                position="top"
              />
            </div>
          )}

          {/* Left opponent - better positioning for mobile */}
          {leftPlayer && (
            <div className="absolute left-1 md:left-4 top-[40%] md:top-1/2 -translate-y-1/2">
              <OpponentHand
                cardCount={leftPlayer.hand.length}
                playerName={leftPlayer.name}
                avatar={leftPlayer.avatar}
                isCurrentTurn={leftPlayer.isCurrentTurn}
                hasPassed={leftPlayer.hasPassed}
                finishOrder={leftPlayer.finishOrder}
                position="left"
              />
            </div>
          )}

          {/* Right opponent - better positioning for mobile */}
          {rightPlayer && (
            <div className="absolute right-1 md:right-4 top-[40%] md:top-1/2 -translate-y-1/2">
              <OpponentHand
                cardCount={rightPlayer.hand.length}
                playerName={rightPlayer.name}
                avatar={rightPlayer.avatar}
                isCurrentTurn={rightPlayer.isCurrentTurn}
                hasPassed={rightPlayer.hasPassed}
                finishOrder={rightPlayer.finishOrder}
                position="right"
              />
            </div>
          )}

          {/* Center play area - slightly higher on mobile to make room for hand */}
          <div className="absolute top-[35%] md:top-[45%] left-1/2 -translate-x-1/2 -translate-y-1/2">
            <PlayArea
              currentHand={currentHand}
              discardPile={discardPile}
              lastPlayerName={
                currentHand
                  ? gamePlayers.find((p) => p.id === currentHand.playerId)?.name
                  : undefined
              }
            />
          </div>

          {/* My hand - positioned at bottom with controls */}
          <div className="absolute bottom-0 left-0 right-0 pb-2 md:pb-4 px-2 flex flex-col items-center z-30">
            {/* Show finish status when player has no cards */}
            {myGamePlayer?.finishOrder && myHand.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-4">
                <div className="text-4xl">
                  {myGamePlayer.finishOrder === 1 && "👑"}
                  {myGamePlayer.finishOrder === 2 && "🎖️"}
                  {myGamePlayer.finishOrder === 3 && "👤"}
                  {myGamePlayer.finishOrder === 4 && "⛓️"}
                </div>
                <div
                  className={`text-lg font-bold ${
                    myGamePlayer.finishOrder === 1
                      ? "text-yellow-400"
                      : myGamePlayer.finishOrder === 2
                      ? "text-purple-400"
                      : myGamePlayer.finishOrder === 3
                      ? "text-blue-400"
                      : "text-gray-400"
                  }`}
                >
                  {myGamePlayer.finishOrder === 1 && "King! 🎉"}
                  {myGamePlayer.finishOrder === 2 && "Noble"}
                  {myGamePlayer.finishOrder === 3 && "Commoner"}
                  {myGamePlayer.finishOrder === 4 && "Slave"}
                </div>
                <div className="text-gray-400 text-sm">
                  รอผู้เล่นอื่นจบเกม...
                </div>
              </div>
            ) : (
              <>
                <PlayerHand
                  cards={myHand}
                  selectedCards={selectedCards}
                  onCardSelect={handleCardSelect}
                  isCurrentTurn={isMyTurn}
                  disabled={!isMyTurn}
                />

                {/* Controls - compact on mobile */}
                <div className="mt-2 md:mt-4 flex justify-center">
                  <GameControls
                    onPlay={handlePlay}
                    onPass={handlePass}
                    canPlay={!!canPlaySelected}
                    canPass={
                      !!myPlayerId && canPass(myPlayerId) && !isFirstTurn
                    }
                    selectedCount={selectedCards.length}
                    isFirstTurn={isFirstTurn}
                  />
                </div>
              </>
            )}
          </div>
        </main>

        {/* Chat Panel */}
        <ChatContainer
          messages={chatMessages}
          onSendMessage={sendChatMessage}
          currentPlayerName={user?.name ?? ""}
        />
      </div>
    );
  }

  // Game end
  if (phase === "game_end") {
    // Sort players by accumulated score (descending)
    const sortedPlayers = [...gamePlayers]
      .filter((p) => p.rank)
      .sort((a, b) => b.score - a.score);

    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center p-4">
        <div className="max-w-lg w-full bg-gray-800 rounded-2xl p-6 sm:p-8">
          {/* Header */}
          <div className="text-center mb-6">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-3" />
            <h1 className="text-2xl font-bold text-white">
              รอบที่ {roundNumber} จบแล้ว!
            </h1>
          </div>

          {/* Scoreboard */}
          <div className="bg-gray-900/50 rounded-xl p-4 mb-6">
            <div className="flex items-center justify-between text-sm text-gray-400 mb-3 px-2">
              <span>ผู้เล่น</span>
              <div className="flex gap-6">
                <span>รอบนี้</span>
                <span>รวม</span>
              </div>
            </div>

            <div className="space-y-2">
              {sortedPlayers.map((player, index) => (
                <div
                  key={player.id}
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-xl transition-all",
                    player.rank === "king" &&
                      "bg-yellow-500/20 ring-2 ring-yellow-500",
                    player.rank === "noble" && "bg-purple-500/20",
                    player.rank === "commoner" && "bg-blue-500/20",
                    player.rank === "slave" && "bg-gray-700/50"
                  )}
                >
                  {/* Rank position */}
                  <div className="w-6 text-center font-bold text-gray-500">
                    #{index + 1}
                  </div>

                  {/* Avatar & Rank emoji */}
                  <div className="relative">
                    <div className="text-3xl">{player.avatar}</div>
                    <div className="absolute -top-1 -right-1 text-lg">
                      {player.rank && PLAYER_RANK_DISPLAY[player.rank].emoji}
                    </div>
                  </div>

                  {/* Name & Rank */}
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-white truncate">
                      {player.name}
                    </div>
                    <div
                      className={cn(
                        "text-xs font-medium",
                        player.rank === "king" && "text-yellow-400",
                        player.rank === "noble" && "text-purple-400",
                        player.rank === "commoner" && "text-blue-400",
                        player.rank === "slave" && "text-gray-400"
                      )}
                    >
                      {player.rank && PLAYER_RANK_DISPLAY[player.rank].name}
                    </div>
                  </div>

                  {/* Scores */}
                  <div className="flex gap-6 items-center">
                    <div
                      className={cn(
                        "w-8 text-center font-bold",
                        player.roundScore > 0
                          ? "text-green-400"
                          : "text-gray-500"
                      )}
                    >
                      +{player.roundScore}
                    </div>
                    <div className="w-10 text-center font-bold text-white text-lg">
                      {player.score}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Score legend */}
          <div className="flex justify-center gap-4 text-xs text-gray-500 mb-6">
            <span>👑 +{RANK_SCORES.king}</span>
            <span>🎖️ +{RANK_SCORES.noble}</span>
            <span>👤 +{RANK_SCORES.commoner}</span>
            <span>⛓️ +{RANK_SCORES.slave}</span>
          </div>

          {/* Actions */}
          <div className="flex gap-3">
            <Link
              href="/lobby"
              className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-gray-700 hover:bg-gray-600 text-white font-medium transition-colors"
            >
              <ArrowLeft className="w-4 h-4" />
              ออกจากเกม
            </Link>
            {isHost && (
              <button
                onClick={() => {
                  // Broadcast new_round to all players
                  const message = {
                    type: "new_round" as const,
                    senderId: peerId!,
                    timestamp: Date.now(),
                  };
                  broadcastToAll(message);

                  // Reset local state
                  useGameStore.getState().resetRound();
                  setGameActions([]);
                }}
                className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-green-500 hover:bg-green-600 text-white font-medium transition-colors"
              >
                <Trophy className="w-4 h-4" />
                เล่นอีกรอบ
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Waiting room (default)
  return (
    <div className="h-svh bg-linear-to-b from-gray-900 to-gray-950 flex flex-col overflow-hidden">
      {/* Compact Header */}
      <header className="shrink-0 border-b border-gray-800 bg-gray-900/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Link
              href="/lobby"
              className="flex items-center gap-1.5 text-gray-400 hover:text-white text-sm"
            >
              <ArrowLeft className="w-4 h-4" />
              <span className="hidden sm:inline">ออก</span>
            </Link>

            <button
              onClick={copyRoomCode}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-800 hover:bg-gray-700"
            >
              <span className="text-gray-400 text-xs">ห้อง:</span>
              <span className="font-mono font-bold text-white tracking-wider">
                {roomCode}
              </span>
              <Copy
                className={`w-3.5 h-3.5 ${
                  copied ? "text-green-400" : "text-gray-500"
                }`}
              />
            </button>

            <div className="flex items-center gap-2">
              {/* Sound toggle */}
              <button
                onClick={toggleSound}
                className="p-1 rounded hover:bg-gray-800 transition-colors"
                title={soundEnabled ? "ปิดเสียง" : "เปิดเสียง"}
              >
                {soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-gray-400" />
                ) : (
                  <VolumeX className="w-4 h-4 text-gray-600" />
                )}
              </button>
              {/* BGM toggle */}
              <button
                onClick={() => {
                  playClick();
                  toggleBgm();
                }}
                className={`px-2 py-0.5 rounded text-xs font-medium transition-colors ${
                  bgmPlaying
                    ? "bg-purple-600 text-white"
                    : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                }`}
                title={bgmPlaying ? "ปิด BGM" : "เปิด BGM"}
              >
                🎵
              </button>
              {/* BGM Style Selector */}
              <select
                value={bgmPlaying ? gameBgmStyle : "off"}
                onChange={(e) => {
                  if (e.target.value === "off") {
                    stopBgm();
                  } else {
                    setGameBgmStyle(e.target.value as typeof gameBgmStyle);
                    if (!bgmPlaying) startGameBgm();
                  }
                }}
                className="bg-gray-700 text-white text-xs rounded px-1.5 py-0.5 border-none outline-none cursor-pointer"
                title="เลือก BGM"
              >
                <option value="off">🔇 ปิด</option>
                <option value="adventure">🗺️ ผจญภัย</option>
                <option value="battle">⚔️ ต่อสู้</option>
                <option value="castle">🏰 ปราสาท</option>
                <option value="tavern">🍺 โรงเตี๊ยม</option>
                <option value="tension">😰 ตึงเครียด</option>
              </select>
              {/* Connection status */}
              {connectionStatus === "connecting" && (
                <Loader2 className="w-4 h-4 text-yellow-400 animate-spin" />
              )}
              {connectionStatus === "connected" && (
                <Wifi className="w-4 h-4 text-green-400" />
              )}
              {connectionStatus === "error" && (
                <WifiOff className="w-4 h-4 text-red-400" />
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content - Flex grow to fill remaining space */}
      <main className="flex-1 container mx-auto px-4 py-3 flex flex-col max-w-3xl">
        {/* Title */}
        <div className="text-center mb-3">
          <h1 className="text-xl font-bold text-white">
            {isHost ? "ห้องของคุณ" : "เข้าร่วมห้อง"}{" "}
            <span className="text-gray-500">({players.length}/4)</span>
          </h1>
        </div>

        {peerError && (
          <div className="mb-3 p-2 bg-red-900/30 border border-red-800 rounded-lg">
            <p className="text-red-400 text-center text-sm">{peerError}</p>
          </div>
        )}

        {/* Two Column Layout */}
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 min-h-0">
          {/* Left: Players Grid */}
          <div className="grid grid-cols-2 gap-2 content-start">
            {[0, 1, 2, 3].map((index) => {
              const player = players[index];
              const isMe = player?.id === user?.id;

              if (player) {
                return (
                  <div
                    key={player.id}
                    className={cn(
                      "bg-gray-800 rounded-lg p-3 text-center relative",
                      player.isHost && "ring-2 ring-yellow-500",
                      isMe && !player.isHost && "ring-2 ring-blue-500"
                    )}
                  >
                    {player.isHost && (
                      <div className="absolute -top-1.5 -right-1.5 bg-yellow-500 text-yellow-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        HOST
                      </div>
                    )}
                    {isMe && (
                      <div className="absolute -top-1.5 -left-1.5 bg-blue-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                        คุณ
                      </div>
                    )}
                    <div className="text-3xl mb-1">{player.avatar}</div>
                    <div className="font-medium text-white text-sm truncate">
                      {player.name}
                    </div>
                    <div className="flex items-center justify-center gap-1 mt-1">
                      {player.isReady ? (
                        <span className="bg-green-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">
                          พร้อม ✓
                        </span>
                      ) : (
                        <span className="text-[10px] text-gray-500">รอ...</span>
                      )}
                    </div>
                  </div>
                );
              }

              return (
                <div
                  key={index}
                  className="bg-gray-800/30 rounded-lg p-3 text-center border border-dashed border-gray-700"
                >
                  <div className="text-3xl mb-1 opacity-20">👤</div>
                  <div className="text-gray-600 text-sm">ว่าง</div>
                </div>
              );
            })}
          </div>

          {/* Right: Settings & Actions */}
          <div className="flex flex-col gap-3">
            {/* Share Room Code - Compact */}
            <div className="bg-gray-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <Users className="w-4 h-4 text-blue-400" />
                <span className="font-medium text-white text-sm">
                  เชิญเพื่อน
                </span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-gray-900 rounded px-3 py-2 text-center">
                  <span className="text-lg font-mono font-bold text-white tracking-widest">
                    {roomCode}
                  </span>
                </div>
                <button
                  onClick={copyRoomCode}
                  className={cn(
                    "px-3 rounded transition-colors",
                    copied
                      ? "bg-green-500 text-white"
                      : "bg-gray-700 hover:bg-gray-600 text-gray-300"
                  )}
                >
                  <Copy className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* AI Mode Toggle - Compact (Host Only) */}
            {isHost && (
              <div className="bg-gray-800 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="w-4 h-4 text-purple-400" />
                    <span className="font-medium text-white text-sm">
                      เล่นกับ AI
                    </span>
                    {aiModeEnabled && (
                      <span className="text-[10px] text-purple-300 bg-purple-500/20 px-1.5 py-0.5 rounded">
                        +{4 - players.length} บอท
                      </span>
                    )}
                  </div>
                  <button
                    onClick={() => setAiModeEnabled(!aiModeEnabled)}
                    className={cn(
                      "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                      aiModeEnabled ? "bg-purple-500" : "bg-gray-600"
                    )}
                  >
                    <span
                      className={cn(
                        "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-transform",
                        aiModeEnabled ? "translate-x-5" : "translate-x-1"
                      )}
                    />
                  </button>
                </div>

                {aiModeEnabled && (
                  <div className="flex gap-1.5 mt-3">
                    <button
                      onClick={() => setAiDifficulty("easy")}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors",
                        aiDifficulty === "easy"
                          ? "bg-green-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      )}
                    >
                      ง่าย
                    </button>
                    <button
                      onClick={() => setAiDifficulty("medium")}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors",
                        aiDifficulty === "medium"
                          ? "bg-yellow-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      )}
                    >
                      ปานกลาง
                    </button>
                    <button
                      onClick={() => setAiDifficulty("hard")}
                      className={cn(
                        "flex-1 py-1.5 px-2 rounded text-xs font-medium transition-colors",
                        aiDifficulty === "hard"
                          ? "bg-red-500 text-white"
                          : "bg-gray-700 text-gray-300 hover:bg-gray-600"
                      )}
                    >
                      ยาก
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Action Buttons - Positioned with safe padding for mobile */}
            <div className="mt-auto pt-4 pb-6 space-y-3">
              {/* Ready button - Larger touch target */}
              <button
                onClick={toggleReady}
                className={cn(
                  "w-full py-4 rounded-xl font-semibold text-lg transition-all active:scale-[0.98]",
                  players.find((p) => p.id === user.id)?.isReady
                    ? "bg-green-600 hover:bg-green-700 text-white shadow-lg shadow-green-900/30"
                    : "bg-gray-700 hover:bg-gray-600 text-white"
                )}
              >
                {players.find((p) => p.id === user.id)?.isReady
                  ? "✓ พร้อมแล้ว"
                  : "กดเพื่อพร้อม"}
              </button>

              {/* Start game button (host only) - Larger touch target */}
              {isHost && (
                <button
                  onClick={handleStartGame}
                  disabled={!canStartGame}
                  className="w-full py-4 rounded-xl bg-linear-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-semibold text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] shadow-lg shadow-red-900/30"
                >
                  {!canStartGame
                    ? aiModeEnabled
                      ? `รอผู้เล่นพร้อม (${
                          players.filter((p) => p.isReady).length
                        }/${players.length})`
                      : `รอครบ 4 คน (${players.length}/4)`
                    : aiModeEnabled && players.length < 4
                    ? `เริ่มเกม! 🤖`
                    : "เริ่มเกม!"}
                </button>
              )}

              {!isHost && allPlayersReady && (
                <p className="text-center text-gray-500 text-sm pb-2">
                  รอเจ้าของห้องเริ่มเกม...
                </p>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Connection lost modal */}
      <ConnectionLostModal />

      {/* Connection UI Components */}
      <DisconnectedPlayersBanner
        players={disconnectedPlayers}
        isHost={isHost}
      />

      {/* Toast Notifications */}
      <ToastContainer />

      {/* Chat Panel */}
      <ChatContainer
        messages={chatMessages}
        onSendMessage={sendChatMessage}
        currentPlayerName={user?.name ?? ""}
      />
    </div>
  );
}
