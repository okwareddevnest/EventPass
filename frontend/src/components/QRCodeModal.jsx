import React from 'react';
import { Download, X } from 'lucide-react';
import Modal from './Modal';

const QRCodeModal = ({ isOpen, onClose, ticket, event }) => {
  const handleDownload = () => {
    if (!ticket?.qrCodeUrl) return;

    // Create a temporary link to download the QR code
    const link = document.createElement('a');
    link.href = ticket.qrCodeUrl;
    link.download = `ticket-${ticket.ticketId}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Ticket - ${event?.title}</title>
          <style>
            body { font-family: Arial, sans-serif; margin: 20px; text-align: center; }
            .ticket { border: 2px solid #1D4ED8; border-radius: 10px; padding: 20px; max-width: 400px; margin: 0 auto; }
            .header { color: #1D4ED8; margin-bottom: 20px; }
            .qr-code { margin: 20px 0; }
            .details { text-align: left; background: #f8f9fa; padding: 15px; border-radius: 5px; margin: 20px 0; }
            .footer { color: #666; font-size: 12px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="ticket">
            <h1 class="header">EventPass Ticket</h1>
            <h2>${event?.title}</h2>
            <div class="qr-code">
              <img src="${ticket?.qrCodeUrl}" alt="QR Code" style="max-width: 200px; height: auto;" />
            </div>
            <div class="details">
              <p><strong>Ticket ID:</strong> ${ticket?.ticketId}</p>
              <p><strong>Event:</strong> ${event?.title}</p>
              <p><strong>Date:</strong> ${event?.date ? new Date(event.date).toLocaleDateString() : ''}</p>
              <p><strong>Location:</strong> ${event?.location}</p>
              <p><strong>Purchase Date:</strong> ${ticket?.purchaseDate ? new Date(ticket.purchaseDate).toLocaleDateString() : ''}</p>
              <p><strong>Price:</strong> $${ticket?.price?.toFixed(2)}</p>
            </div>
            <div class="footer">
              <p>Please present this ticket at the event entrance.</p>
              <p>Valid only for the specified event and date.</p>
            </div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  if (!ticket || !event) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Your Ticket" size="md">
      <div className="space-y-6">
        {/* Event Info */}
        <div className="text-center">
          <h3 className="text-xl font-bold text-neutral mb-2">{event.title}</h3>
          <p className="text-neutral/70">
            {new Date(event.date).toLocaleDateString('en-US', {
              weekday: 'long',
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </p>
          <p className="text-neutral/70 text-sm">{event.location}</p>
        </div>

        {/* QR Code */}
        <div className="flex justify-center">
          <div className="bg-white p-4 rounded-lg shadow-lg">
            <img
              src={ticket.qrCodeUrl}
              alt="Ticket QR Code"
              className="w-48 h-48"
            />
          </div>
        </div>

        {/* Ticket Details */}
        <div className="bg-white/5 rounded-lg p-4 space-y-2">
          <div className="flex justify-between">
            <span className="text-neutral/70">Ticket ID:</span>
            <span className="text-neutral font-mono text-sm">{ticket.ticketId}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral/70">Purchase Date:</span>
            <span className="text-neutral">
              {new Date(ticket.purchaseDate).toLocaleDateString()}
            </span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral/70">Price:</span>
            <span className="text-neutral">${ticket.price.toFixed(2)}</span>
          </div>

          <div className="flex justify-between">
            <span className="text-neutral/70">Status:</span>
            <span className={`capitalize ${
              ticket.status === 'valid' ? 'text-green-400' :
              ticket.status === 'used' ? 'text-blue-400' :
              'text-red-400'
            }`}>
              {ticket.status}
            </span>
          </div>
        </div>

        {/* Instructions */}
        <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
          <h4 className="text-blue-300 font-semibold mb-2">How to use your ticket:</h4>
          <ul className="text-blue-200 text-sm space-y-1">
            <li>• Present this QR code at the event entrance</li>
            <li>• Each QR code is unique and can only be used once</li>
            <li>• Make sure the code is clearly visible for scanning</li>
            <li>• Download or print your ticket as backup</li>
          </ul>
        </div>

        {/* Actions */}
        <div className="flex space-x-4">
          <button
            onClick={handleDownload}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors duration-200"
          >
            <Download size={18} />
            <span>Download</span>
          </button>

          <button
            onClick={handlePrint}
            className="flex-1 flex items-center justify-center space-x-2 px-4 py-3 border border-white/20 text-neutral rounded-lg hover:bg-white/5 transition-colors duration-200"
          >
            <span>Print Ticket</span>
          </button>
        </div>

        <p className="text-xs text-neutral/50 text-center">
          This ticket is valid only for the specified event and date.
          Keep your ticket secure and do not share the QR code.
        </p>
      </div>
    </Modal>
  );
};

export default QRCodeModal;
