'use client';

import React, { useState, useCallback } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import { Button } from '@/components/ui/Button';
import { 
  PhotoIcon,
  LinkIcon,
  InformationCircleIcon 
} from '@heroicons/react/24/outline';

// Form validation schema
const schema = yup.object().shape({
  name: yup.string()
    .required('Coin name is required')
    .min(3, 'Name must be at least 3 characters')
    .max(50, 'Name must be less than 50 characters'),
  ticker: yup.string()
    .required('Ticker is required')
    .min(3, 'Ticker must be at least 3 characters')
    .max(6, 'Ticker must be less than 6 characters')
    .matches(/^[A-Z]+$/, 'Ticker must be uppercase letters only'),
  description: yup.string()
    .max(500, 'Description must be less than 500 characters'),
  website: yup.string().url('Must be a valid URL').optional(),
  twitter: yup.string().optional(),
  telegram: yup.string().optional(),
});

type FormData = yup.InferType<typeof schema>;

export default function CreateTokenPage() {
  const [isWalletConnected, setIsWalletConnected] = useState(false);
  const [uploadedImage, setUploadedImage] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      ticker: '',
      description: '',
      website: '',
      twitter: '',
      telegram: ''
    }
  });

  const watchedValues = watch();

  // Mock file upload handler
  const handleFileUpload = useCallback((file: File) => {
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragActive(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  }, [handleFileUpload]);

  const onSubmit = async (data: FormData) => {
    if (!isWalletConnected) {
      setIsWalletConnected(true);
      return;
    }

    // Mock token creation process
    console.log('Creating token:', data);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    alert(`Token "${data.name}" ($${data.ticker}) created successfully!`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold text-text-primary">Create new coin</h1>
        <p className="text-text-secondary">
          Once created, coins can't be changed once the fair launch token deployment is confirmed.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Side - Form */}
        <div className="space-y-6">
          <div className="bg-background-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-6">Coin details</h2>
            
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* Coin Name */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Coin name
                </label>
                <input
                  {...register('name')}
                  placeholder="Name your coin"
                  className={`
                    w-full px-3 py-2 bg-background-dark border rounded-lg 
                    text-text-primary placeholder-text-muted
                    focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent
                    transition-all duration-200
                    ${errors.name ? 'border-primary-red' : 'border-border'}
                  `}
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-primary-red">{errors.name.message}</p>
                )}
              </div>

              {/* Ticker */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Ticker
                </label>
                <input
                  {...register('ticker')}
                  placeholder="Add a coin ticker (e.g. DOGE)"
                  className={`
                    w-full px-3 py-2 bg-background-dark border rounded-lg 
                    text-text-primary placeholder-text-muted
                    focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent
                    transition-all duration-200
                    ${errors.ticker ? 'border-primary-red' : 'border-border'}
                  `}
                />
                {errors.ticker && (
                  <p className="mt-1 text-sm text-primary-red">{errors.ticker.message}</p>
                )}
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-text-primary mb-2">
                  Description <span className="text-text-muted">(Optional)</span>
                </label>
                <textarea
                  {...register('description')}
                  placeholder="Write a short description"
                  rows={3}
                  className={`
                    w-full px-3 py-2 bg-background-dark border rounded-lg 
                    text-text-primary placeholder-text-muted resize-none
                    focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent
                    transition-all duration-200
                    ${errors.description ? 'border-primary-red' : 'border-border'}
                  `}
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-primary-red">{errors.description.message}</p>
                )}
              </div>

              {/* Social Links */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <LinkIcon className="w-4 h-4 text-text-muted" />
                  <span className="text-sm font-medium text-text-primary">
                    Add social links <span className="text-text-muted">(Optional)</span>
                  </span>
                </div>

                <div className="space-y-2">
                  <input
                    {...register('website')}
                    placeholder="Website (https://...)"
                    className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                  
                  <input
                    {...register('twitter')}
                    placeholder="Twitter (@username or full URL)"
                    className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                  
                  <input
                    {...register('telegram')}
                    placeholder="Telegram (https://t.me/...)"
                    className="w-full px-3 py-2 bg-background-dark border border-border rounded-lg text-text-primary placeholder-text-muted focus:outline-none focus:ring-2 focus:ring-primary-green focus:border-transparent"
                  />
                </div>
              </div>
            </form>
          </div>

          {/* File Upload */}
          <div className="bg-background-card border border-border rounded-lg p-6">
            <div
              className={`
                border-2 border-dashed rounded-lg p-8 text-center transition-all duration-200
                ${isDragActive 
                  ? 'border-primary-green bg-primary-green/5' 
                  : 'border-border hover:border-border-light'
                }
              `}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
            >
              {uploadedImage ? (
                <div className="space-y-4">
                  <img 
                    src={uploadedImage} 
                    alt="Uploaded"
                    className="w-24 h-24 rounded-full mx-auto object-cover"
                  />
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => setUploadedImage(null)}
                  >
                    Remove Image
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <PhotoIcon className="w-12 h-12 text-text-muted mx-auto" />
                  <div>
                    <p className="text-text-primary font-medium">Select video or image to upload</p>
                    <p className="text-text-muted text-sm">or drag and drop it here</p>
                  </div>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    id="file-upload"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleFileUpload(e.target.files[0]);
                      }
                    }}
                  />
                  <Button 
                    variant="primary" 
                    size="sm"
                    onClick={() => document.getElementById('file-upload')?.click()}
                  >
                    Log in
                  </Button>
                </div>
              )}
            </div>

            {/* File Requirements */}
            <div className="mt-4 space-y-2">
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-muted">
                  <p className="font-medium">File size and type</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>• Image: max 30MB, .jpg recommended</li>
                    <li>• Video: max 50MB, .mp4 recommended</li>
                  </ul>
                </div>
              </div>
              
              <div className="flex items-start gap-2">
                <InformationCircleIcon className="w-4 h-4 text-text-muted mt-0.5 flex-shrink-0" />
                <div className="text-xs text-text-muted">
                  <p className="font-medium">Resolution and aspect ratio</p>
                  <ul className="mt-1 space-y-0.5">
                    <li>• Image: 1:1 to 2:1, 200px recommended</li>
                    <li>• Video: 16:9 to 2:1, 720px recommended</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Terms */}
          <div className="flex items-start gap-2 p-4 bg-background-dark rounded-lg">
            <InformationCircleIcon className="w-5 h-5 text-text-muted mt-0.5 flex-shrink-0" />
            <p className="text-sm text-text-muted">
              Coin data (name, ticker, and coin logo) can only be added once on creation and can't be changed or edited after creation.
            </p>
          </div>

          {/* Submit Button */}
          <Button 
            fullWidth 
            size="lg"
            loading={isSubmitting}
            onClick={handleSubmit(onSubmit)}
            disabled={!watchedValues.name || !watchedValues.ticker}
          >
            {!isWalletConnected ? 'Login to create coin' : 'Create coin'}
          </Button>
        </div>

        {/* Right Side - Preview */}
        <div className="space-y-6">
          <div className="bg-background-card border border-border rounded-lg p-6">
            <h2 className="text-xl font-semibold text-text-primary mb-6">Preview</h2>
            
            <div className="text-center space-y-4">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary-green to-accent-blue flex items-center justify-center text-black font-bold text-2xl mx-auto">
                {uploadedImage ? (
                  <img 
                    src={uploadedImage} 
                    alt="Token preview"
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span>{watchedValues.ticker ? watchedValues.ticker.charAt(0) : '?'}</span>
                )}
              </div>
              
              <div>
                <h3 className="text-lg font-semibold text-text-primary">
                  {watchedValues.name || 'Coin Name'}
                </h3>
                <p className="text-text-secondary">
                  ${watchedValues.ticker || 'TICKER'}
                </p>
              </div>
              
              <p className="text-sm text-text-secondary">
                {watchedValues.description || 'A preview of how the coin will look like'}
              </p>
              
              <div className="text-center text-text-muted">
                <p className="text-xs">Market cap: $0</p>
                <p className="text-xs">Created just now</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}