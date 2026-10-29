import React, { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Plus, X, Music, Video, Image, FileText, Link as LinkIcon } from "lucide-react";

const getEmbedType = (url) => {
  if (url.includes('spotify.com')) return 'spotify';
  if (url.includes('youtube.com') || url.includes('youtu.be')) return 'youtube';
  if (url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) return 'image';
  if (url.match(/\.(pdf)$/i)) return 'pdf';
  return 'link';
};

const getSpotifyEmbedUrl = (url) => {
  // Convert Spotify URL to embed format
  const match = url.match(/spotify\.com\/(track|album|playlist)\/([a-zA-Z0-9]+)/);
  if (match) {
    return `https://open.spotify.com/embed/${match[1]}/${match[2]}`;
  }
  return null;
};

const getYouTubeEmbedUrl = (url) => {
  // Convert YouTube URL to embed format
  const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
  if (match) {
    return `https://www.youtube-nocookie.com/embed/${match[1]}`;
  }
  return null;
};

export default function PinboardEmbed({ items = [], onAdd, onRemove, isDark = false, maxItems = 6 }) {
  const [newUrl, setNewUrl] = useState("");
  const [newTitle, setNewTitle] = useState("");

  const handleAdd = () => {
    if (!newUrl.trim()) return;

    const type = getEmbedType(newUrl);
    const item = {
      type,
      url: newUrl,
      title: newTitle || newUrl,
      content: null
    };

    onAdd(item);
    setNewUrl("");
    setNewTitle("");
  };

  const renderEmbed = (item) => {
    switch (item.type) {
      case 'spotify':
        const spotifyUrl = getSpotifyEmbedUrl(item.url);
        return spotifyUrl ? (
          <iframe
            src={spotifyUrl}
            width="100%"
            height="152"
            frameBorder="0"
            allow="encrypted-media"
            className="rounded-lg"
          />
        ) : (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-green-500 underline">
            {item.title}
          </a>
        );

      case 'youtube':
        const youtubeUrl = getYouTubeEmbedUrl(item.url);
        return youtubeUrl ? (
          <iframe
            src={youtubeUrl}
            width="100%"
            height="200"
            frameBorder="0"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
            className="rounded-lg"
          />
        ) : (
          <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-red-500 underline">
            {item.title}
          </a>
        );

      case 'image':
        return (
          <img
            src={item.url}
            alt={item.title}
            className="w-full h-48 object-cover rounded-lg"
          />
        );

      case 'pdf':
        return (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 p-4 bg-red-50 rounded-lg hover:bg-red-100"
          >
            <FileText className="w-6 h-6 text-red-600" />
            <span className="text-sm font-medium">{item.title}</span>
          </a>
        );

      default:
        return (
          <a
            href={item.url}
            target="_blank"
            rel="noopener noreferrer"
            className={`flex items-center gap-2 p-4 rounded-lg hover:opacity-80 ${
              isDark ? 'bg-slate-700' : 'bg-gray-100'
            }`}
          >
            <LinkIcon className="w-5 h-5" />
            <span className="text-sm truncate">{item.title}</span>
          </a>
        );
    }
  };

  const getIcon = (type) => {
    switch (type) {
      case 'spotify': return <Music className="w-4 h-4" />;
      case 'youtube': return <Video className="w-4 h-4" />;
      case 'image': return <Image className="w-4 h-4" />;
      case 'pdf': return <FileText className="w-4 h-4" />;
      default: return <LinkIcon className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-4">
      {items.length < maxItems && (
        <Card className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
          <CardContent className="p-4 space-y-3">
            <Input
              placeholder="Paste URL (Spotify, YouTube, image, PDF, or link)"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              className={isDark ? 'bg-slate-900 border-slate-600' : ''}
            />
            <Input
              placeholder="Title (optional)"
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              className={isDark ? 'bg-slate-900 border-slate-600' : ''}
            />
            <Button
              onClick={handleAdd}
              className="w-full bg-gradient-to-r from-purple-500 to-pink-500"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add to Pinboard
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {items.map((item, idx) => (
          <Card key={idx} className={isDark ? 'bg-slate-800 border-slate-700' : 'bg-white'}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Badge variant="outline" className="gap-1">
                  {getIcon(item.type)}
                  {item.type}
                </Badge>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onRemove(idx)}
                  className="h-6 w-6"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              {renderEmbed(item)}
            </CardContent>
          </Card>
        ))}
      </div>

      {items.length >= maxItems && (
        <p className={`text-sm text-center ${
          isDark ? 'text-slate-400' : 'text-gray-500'
        }`}>
          Maximum {maxItems} items reached
        </p>
      )}
    </div>
  );
}