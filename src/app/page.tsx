'use client';

import { useState, useEffect, useCallback } from 'react';
import { S3Config, S3Object, listObjects, getDownloadUrl, uploadFile, deleteFile } from '@/services/s3';
import { Sidebar, SidebarContent, SidebarGroup, SidebarMenu, SidebarMenuItem, SidebarMenuButton, SidebarHeader, SidebarInput, SidebarTrigger, SidebarProvider } from '@/components/ui/sidebar';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { File, FolderPlus, Upload, Trash2, Download, Eye, List, Grid } from 'lucide-react';
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import { Progress } from '@/components/ui/progress';
import { AlertDialog, AlertDialogTrigger, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogDescription, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog"
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog"
import { Breadcrumb, BreadcrumbItem } from "@/components/ui/breadcrumb"

interface FileItemProps {
  file: S3Object;
  onDownload: (key: string) => void;
  onDelete: (key: string) => void;
  onPreview: (file: S3Object) => void;
}

const FileItemGrid: React.FC<FileItemProps> = ({ file, onDownload, onDelete, onPreview }) => {
  const formattedLastModified = file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'N/A';
  const fileSizeInKB = file.size ? (file.size / 1024).toFixed(2) : 'N/A';

  return (
    <Card>
      <CardHeader>
        <CardTitle>{file.key}</CardTitle>
        <CardDescription>
          Size: {fileSizeInKB} KB, Last Modified: {formattedLastModified}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Add file preview logic here if applicable */}
        <p>No preview available.</p>
      </CardContent>
      <CardFooter className="flex justify-end gap-2">
        <Button size="icon" onClick={() => onDownload(file.key)}>
          <Download className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={() => onPreview(file)}>
          <Eye className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the file from your S3 bucket.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(file.key)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardFooter>
    </Card>
  );
};

const FileItemList: React.FC<FileItemProps> = ({ file, onDownload, onDelete, onPreview }) => {
  const formattedLastModified = file.lastModified ? new Date(file.lastModified).toLocaleDateString() : 'N/A';
  const fileSizeInKB = file.size ? (file.size / 1024).toFixed(2) : 'N/A';

  return (
    <div className="flex items-center justify-between py-2 border-b">
      <div>
        <div className="font-semibold">{file.key}</div>
        <div className="text-sm text-muted-foreground">
          Size: {fileSizeInKB} KB, Last Modified: {formattedLastModified}
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="icon" onClick={() => onDownload(file.key)}>
          <Download className="h-4 w-4" />
        </Button>
        <Button size="icon" onClick={() => onPreview(file)}>
          <Eye className="h-4 w-4" />
        </Button>
        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="icon">
              <Trash2 className="h-4 w-4" />
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the file from your S3 bucket.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction onClick={() => onDelete(file.key)}>Continue</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
};

interface FolderItemProps {
  folder: S3Object;
  onSelect: (key: string) => void;
}

const FolderItem: React.FC<FolderItemProps> = ({ folder, onSelect }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{folder.key}</CardTitle>
      </CardHeader>
      <CardContent>
        <Button onClick={() => onSelect(folder.key)} size="icon">
          <FolderPlus className="h-4 w-4" />
        </Button>
      </CardContent>
    </Card>
  );
};

const initialS3Config: S3Config = {
  bucketName: '',
  region: '',
  accessKeyId: '',
  secretAccessKey: '',
};

export default function Home() {
  const [s3Config, setS3Config] = useState<S3Config>(initialS3Config);
  const [s3Objects, setS3Objects] = useState<S3Object[]>([]);
  const [currentPath, setCurrentPath] = useState<string>('');
  const [pathHistory, setPathHistory] = useState<string[]>(['']); // Initialize with root path
  const [selectedFile, setSelectedFile] = useState<S3Object | null>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    const storedConfig = localStorage.getItem('s3Config');
    if (storedConfig) {
      setS3Config(JSON.parse(storedConfig));
    }
  }, []);

  const handleConfigUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const config = file ? JSON.parse(e.target?.result as string) : initialS3Config;
        setS3Config(config);
        localStorage.setItem('s3Config', JSON.stringify(config));
        toast({
          title: 'Configuration Uploaded',
          description: 'S3 configuration has been successfully uploaded.',
        });
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to parse configuration file.',
          variant: 'destructive',
        });
      }
    };
    if (file) {
      reader.readAsText(file);
    } else {
      // If no file is selected, still set the config to initial values to avoid errors
      setS3Config(initialS3Config);
      localStorage.setItem('s3Config', JSON.stringify(initialS3Config));
      toast({
        title: 'Configuration Reset',
        description: 'S3 configuration has been reset to initial values.',
      });
    }
  };

  const fetchObjects = useCallback(async (path: string) => {
    if (!s3Config.bucketName || !s3Config.region || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
      toast({
        title: 'Missing Configuration',
        description: 'Please upload S3 configuration first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const objects = await listObjects(s3Config, path);
      setS3Objects(objects);
    } catch (error: any) {
      toast({
        title: 'Error',
        description: `Failed to list objects: ${error.message}`,
        variant: 'destructive',
      });
    }
  }, [s3Config, toast]);

  useEffect(() => {
    if (s3Config.bucketName) {
      fetchObjects('');
    }
  }, [s3Config, fetchObjects]);

  const handlePathSelect = (path: string, addToHistory: boolean = true) => {
    setCurrentPath(path);
    fetchObjects(path);

    if (addToHistory) {
      setPathHistory(prevHistory => [...prevHistory, path]);
    }
  };

  const navigateBack = () => {
    if (pathHistory.length > 1) {
      const newHistory = pathHistory.slice(0, -1);
      setPathHistory(newHistory);
      const previousPath = newHistory[newHistory.length - 1];
      setCurrentPath(previousPath);
      fetchObjects(previousPath);
    }
  };

  const handleFileDownload = async (key: string) => {
    try {
      const url = await getDownloadUrl(s3Config, key);
      window.open(url, '_blank');
    } catch (error: any) {
      toast({
        title: 'Download Error',
        description: `Failed to get download URL: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleFileSelect = (file: S3Object) => {
    setSelectedFile(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      toast({
        title: 'No File Selected',
        description: 'Please select a file to upload.',
        variant: 'destructive',
      });
      return;
    }

    if (!s3Config.bucketName || !s3Config.region || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
      toast({
        title: 'Missing Configuration',
        description: 'Please upload S3 configuration first.',
        variant: 'destructive',
      });
      return;
    }

    setUploading(true);
    setUploadProgress(0);

    try {
      const filePath = currentPath ? `${currentPath}/${file.name}` : file.name;
      // Convert file to Buffer for upload
      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);

      // Simulate upload progress (replace with actual progress tracking if possible)
      let progress = 0;
      const interval = setInterval(() => {
        progress += 10;
        setUploadProgress(Math.min(progress, 100));
        if (progress >= 100) {
          clearInterval(interval);
        }
      }, 100);

      await uploadFile(s3Config, filePath, buffer);
      toast({
        title: 'File Uploaded',
        description: `${file.name} has been successfully uploaded.`,
      });
      fetchObjects(currentPath); // Refresh file list
    } catch (error: any) {
      toast({
        title: 'Upload Error',
        description: `Failed to upload file: ${error.message}`,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setUploadProgress(0);
    }
  };

  const handleDeleteFile = async (key: string) => {
    if (!s3Config.bucketName || !s3Config.region || !s3Config.accessKeyId || !s3Config.secretAccessKey) {
      toast({
        title: 'Missing Configuration',
        description: 'Please upload S3 configuration first.',
        variant: 'destructive',
      });
      return;
    }

    try {
      await deleteFile(s3Config, key);
      toast({
        title: 'File Deleted',
        description: `${key} has been successfully deleted.`,
      });
      fetchObjects(currentPath); // Refresh file list
    } catch (error: any) {
      toast({
        title: 'Delete Error',
        description: `Failed to delete file: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const handleFilePreview = async (file: S3Object) => {
    try {
      const url = await getDownloadUrl(s3Config, file.key);
      setPreviewUrl(url);
      setSelectedFile(file);
    } catch (error: any) {
      toast({
        title: 'Preview Error',
        description: `Failed to get preview URL: ${error.message}`,
        variant: 'destructive',
      });
    }
  };

  const closePreviewDialog = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
  };

  const toggleViewMode = () => {
    setViewMode(prevMode => (prevMode === 'grid' ? 'list' : 'grid'));
  };


  return (
    <SidebarProvider>
      <div className="flex h-screen bg-secondary">
        <Sidebar className="w-64 border-r border-border flex-shrink-0">
          <SidebarHeader>
            <h4 className="font-semibold text-lg">S3 Bucket Explorer</h4>
            <Input
              type="file"
              accept=".json"
              onChange={handleConfigUpload}
              className="text-sm"
            />
            <p className="text-xs text-muted-foreground">Upload S3 config JSON</p>
            <details>
              <summary className="text-xs text-muted-foreground cursor-pointer">
                Sample JSON Structure
              </summary>
              <pre className="text-xs text-muted-foreground">
                {JSON.stringify(initialS3Config, null, 2)}
              </pre>
            </details>
          </SidebarHeader>
          <SidebarContent>
            <ScrollArea className="h-[calc(100vh-10rem)]">
              <SidebarGroup>
                <SidebarMenu>
                  <SidebarMenuItem>
                    <SidebarMenuButton onClick={() => handlePathSelect('')}>
                      <File />
                      <span>Root</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                  {s3Objects.filter(obj => obj.type === 'folder').map(folder => (
                    <SidebarMenuItem key={folder.key}>
                      <SidebarMenuButton onClick={() => handlePathSelect(folder.key)}>
                        <FolderPlus />
                        <span>{folder.key}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroup>
            </ScrollArea>
          </SidebarContent>
        </Sidebar>

        <div className="flex-1 p-4">
          <div className="flex items-center justify-between mb-4">
            <Breadcrumb>
              {pathHistory.map((path, index) => (
                <BreadcrumbItem key={index} onClick={() => {
                  // Navigate back to this breadcrumb
                  const newHistory = pathHistory.slice(0, index + 1);
                  setPathHistory(newHistory);
                  const selectedPath = newHistory[newHistory.length - 1];
                  setCurrentPath(selectedPath);
                  fetchObjects(selectedPath);
                }}>
                  {path === '' ? 'Root' : path.split('/').pop()}
                </BreadcrumbItem>
              ))}
            </Breadcrumb>
            <Button size="icon" onClick={toggleViewMode}>
              {viewMode === 'grid' ? <List className="h-4 w-4" /> : <Grid className="h-4 w-4" />}
            </Button>
          </div>
          <h2 className="text-2xl font-semibold mb-4">
            {currentPath ? `Contents of ${currentPath}` : 'Bucket Root'}
          </h2>
          <div className="mb-4">
            <Input
              type="file"
              onChange={handleFileUpload}
              className="text-sm"
              id="upload-file"
              disabled={uploading}
            />
            <label htmlFor="upload-file" className="text-xs text-muted-foreground">
              Upload file to current folder
            </label>
            {uploading && (
              <Progress value={uploadProgress} className="mt-2" />
            )}
          </div>
          {viewMode === 'grid' ? (
            <div className="grid gap-4 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
              {s3Objects.filter(obj => obj.type === 'file').map(file => (
                <FileItemGrid key={file.key} file={file} onDownload={handleFileDownload} onDelete={handleDeleteFile} onPreview={handleFilePreview} />
              ))}
              {s3Objects.filter(obj => obj.type === 'folder').map(folder => (
                <FolderItem key={folder.key} folder={folder} onSelect={handlePathSelect} />
              ))}
            </div>
          ) : (
            <div>
              {s3Objects.filter(obj => obj.type === 'file').map(file => (
                <FileItemList key={file.key} file={file} onDownload={handleFileDownload} onDelete={handleDeleteFile} onPreview={handleFilePreview} />
              ))}
              {s3Objects.filter(obj => obj.type === 'folder').map(folder => (
                <FolderItem key={folder.key} folder={folder} onSelect={handlePathSelect} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Dialog open={!!previewUrl} onOpenChange={closePreviewDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedFile?.key}</DialogTitle>
            <DialogDescription>
              Preview of the selected file.
            </DialogDescription>
          </DialogHeader>
          {previewUrl && (
            <img src={previewUrl} alt="File Preview" className="max-h-64 object-contain" />
          )}
        </DialogContent>
      </Dialog>
    </SidebarProvider>
  );
}
