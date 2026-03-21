'use client';

import React from 'react';
import Link from 'next/link';
import { 
  FileText, FileImage, FileCode, SwitchCamera, 
  Scissors, Type, Image as ImageIcon, Lock, 
  Unlock, FileSignature, Edit3, ImageDown
} from 'lucide-react';
import { motion } from 'framer-motion';

const tools = [
  { name: 'PDF to Word', slug: 'pdf-to-word', desc: 'Convert PDF files to editable Word formats', icon: FileText, color: 'text-blue-500', bg: 'bg-blue-100' },
  { name: 'Word to PDF', slug: 'word-to-pdf', desc: 'Convert Word documents to PDF easily', icon: FileText, color: 'text-orange-500', bg: 'bg-orange-100' },
  { name: 'Merge PDF', slug: 'merge-pdf', desc: 'Combine multiple PDFs into one document', icon: SwitchCamera, color: 'text-purple-500', bg: 'bg-purple-100' },
  { name: 'Compress PDF', slug: 'compress-pdf', desc: 'Reduce the file size of your PDF', icon: FileImage, color: 'text-red-500', bg: 'bg-red-100' },
  { name: 'JPG to PDF', slug: 'jpg-to-pdf', desc: 'Transform images into PDF documents', icon: ImageIcon, color: 'text-green-500', bg: 'bg-green-100' },
  { name: 'PDF to JPG', slug: 'pdf-to-jpg', desc: 'Extract pages from your PDF to JPG', icon: ImageDown, color: 'text-yellow-500', bg: 'bg-yellow-100' },
  { name: 'Split PDF', slug: 'split-pdf', desc: 'Separate one page or a whole set for easy conversion in PDF', icon: Scissors, color: 'text-indigo-500', bg: 'bg-indigo-100' },
  { name: 'Extract Images', slug: 'extract-images', desc: 'Extract all images contained in a PDF', icon: ImageDown, color: 'text-teal-500', bg: 'bg-teal-100' },
  { name: 'Protect PDF', slug: 'protect-pdf', desc: 'Add a password to your PDF file', icon: Lock, color: 'text-gray-700', bg: 'bg-gray-200' },
  { name: 'Unlock PDF', slug: 'unlock-pdf', desc: 'Remove password security from your PDF', icon: Unlock, color: 'text-green-600', bg: 'bg-green-100' },
  { name: 'Watermark PDF', slug: 'watermark-pdf', desc: 'Stamp an image or text over your PDF in seconds', icon: Edit3, color: 'text-pink-500', bg: 'bg-pink-100' },
  { name: 'Sign PDF', slug: 'sign-pdf', desc: 'Add a signature to your PDF document', icon: FileSignature, color: 'text-blue-600', bg: 'bg-blue-100' }
];

export default function ToolsPage() {
  return (
    <div className="bg-gray-50 min-h-screen pb-20 pt-10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16 mt-8">
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 mb-6 tracking-tight">
            Free Tools to Make Your Life Easier
          </h1>
          <p className="text-xl text-gray-600">
            A comprehensive suite of easy-to-use, free online tools to convert, edit, and optimize your files.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {tools.map((tool, index) => (
            <Link href={`/tools/${tool.slug}`} key={index}>
              <motion.div 
                whileHover={{ y: -5, scale: 1.02 }}
                transition={{ duration: 0.2 }}
                className="bg-white rounded-2xl p-6 shadow-sm hover:shadow-xl border border-gray-100 flex flex-col items-center text-center cursor-pointer group h-full"
              >
                <div className={`w-16 h-16 rounded-2xl ${tool.bg} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                  <tool.icon className={`w-8 h-8 ${tool.color}`} />
                </div>
                <h3 className="text-lg font-bold text-gray-900 mb-2">{tool.name}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{tool.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>

      </div>
    </div>
  );
}
