'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, MicOff, Video, VideoOff } from 'lucide-react';
import { Room, Track, RoomEvent } from 'livekit-client';
import { toast } from 'sonner';

interface RoomControlsProps {
  room: Room | null;
  onMuteChange?: (muted: boolean) => void;
  onVideoChange?: (enabled: boolean) => void;
}

export function RoomControls({ room, onMuteChange, onVideoChange }: RoomControlsProps) {
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isLoading, setIsLoading] = useState(false);

  // Sync state with actual track states
  useEffect(() => {
    if (!room) return;

    const updateStates = () => {
      const micTrack = room.localParticipant.getTrackPublication(Track.Source.Microphone);
      const cameraTrack = room.localParticipant.getTrackPublication(Track.Source.Camera);
      
      setIsMuted(!micTrack || micTrack.isMuted || !micTrack.isSubscribed);
      setIsVideoEnabled(!!(cameraTrack && !cameraTrack.isMuted && cameraTrack.isSubscribed));
    };

    updateStates();
    
    room.on(RoomEvent.TrackPublished, updateStates);
    room.on(RoomEvent.TrackUnpublished, updateStates);
    room.on(RoomEvent.TrackSubscribed, updateStates);
    room.on(RoomEvent.TrackUnsubscribed, updateStates);

    return () => {
      room.off(RoomEvent.TrackPublished, updateStates);
      room.off(RoomEvent.TrackUnpublished, updateStates);
      room.off(RoomEvent.TrackSubscribed, updateStates);
      room.off(RoomEvent.TrackUnsubscribed, updateStates);
    };
  }, [room]);

  const toggleMute = async () => {
    console.log('toggleMute called', { room: !!room, roomState: room?.state });
    
    if (!room) {
      toast.error('房间当前不可用');
      return;
    }

    // Only allow if room is connected
    if (room.state !== 'connected') {
      toast.error(`房间当前状态为 ${room.state}，请等待连接完成。`);
      return;
    }

    setIsLoading(true);
    try {
      const localParticipant = room.localParticipant;
      const micTrack = localParticipant.getTrackPublication(Track.Source.Microphone);
      const isCurrentlyMuted = !micTrack || micTrack.isMuted || !micTrack.isSubscribed;

      console.log('Mute state:', { micTrack: !!micTrack, isMuted: micTrack?.isMuted, isCurrentlyMuted });

      if (isCurrentlyMuted) {
        await localParticipant.setMicrophoneEnabled(true);
        setIsMuted(false);
        onMuteChange?.(false);
        toast.success('麦克风已开启');
      } else {
        await localParticipant.setMicrophoneEnabled(false);
        setIsMuted(true);
        onMuteChange?.(true);
        toast.success('麦克风已静音');
      }
    } catch (error) {
      console.error('Failed to toggle mute:', error);
      toast.error(`切换麦克风失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleVideo = async () => {
    console.log('toggleVideo called', { room: !!room, roomState: room?.state });
    
    if (!room) {
      toast.error('房间当前不可用');
      return;
    }

    // Only allow if room is connected
    if (room.state !== 'connected') {
      toast.error(`房间当前状态为 ${room.state}，请等待连接完成。`);
      return;
    }

    setIsLoading(true);
    try {
      const localParticipant = room.localParticipant;
      const cameraTrack = localParticipant.getTrackPublication(Track.Source.Camera);
      const isCurrentlyEnabled = cameraTrack && !cameraTrack.isMuted && cameraTrack.isSubscribed;

      console.log('Video state:', { cameraTrack: !!cameraTrack, isMuted: cameraTrack?.isMuted, isCurrentlyEnabled });

      if (isCurrentlyEnabled) {
        await localParticipant.setCameraEnabled(false);
        setIsVideoEnabled(false);
        onVideoChange?.(false);
        toast.success('摄像头已关闭');
      } else {
        await localParticipant.setCameraEnabled(true);
        setIsVideoEnabled(true);
        onVideoChange?.(true);
        toast.success('摄像头已开启');
      }
    } catch (error) {
      console.error('Failed to toggle video:', error);
      toast.error(`切换摄像头失败：${error instanceof Error ? error.message : '未知错误'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const isRoomReady = room && room.state !== 'disconnected';

  return (
    <div className="flex items-center justify-center space-x-4 p-2">
      <Button
        variant={isMuted ? 'destructive' : 'default'}
        size="sm"
        onClick={toggleMute}
        className="rounded-full"
        disabled={!isRoomReady || isLoading}
        title={!isRoomReady ? '正在等待房间连接...' : isMuted ? '取消静音' : '静音'}
      >
        {isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
      </Button>

      <Button
        variant={isVideoEnabled ? 'default' : 'secondary'}
        size="sm"
        onClick={toggleVideo}
        className="rounded-full"
        disabled={!isRoomReady || isLoading}
        title={!isRoomReady ? '正在等待房间连接...' : isVideoEnabled ? '关闭摄像头' : '开启摄像头'}
      >
        {isVideoEnabled ? <Video className="h-4 w-4" /> : <VideoOff className="h-4 w-4" />}
      </Button>
    </div>
  );
}

