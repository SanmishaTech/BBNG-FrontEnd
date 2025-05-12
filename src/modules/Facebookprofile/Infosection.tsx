import { Briefcase, Calendar, Edit, Mail, MapPin, Phone, School, User, Globe, Building, CreditCard, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MemberData } from "@/types/member";
import { useState } from "react";

interface InfoSectionProps {
  memberData: MemberData | null;
}

const Infosection = ({ memberData }: InfoSectionProps) => {
  const [showBusinessDetails, setShowBusinessDetails] = useState(false);
  const [showPersonalDetails, setShowPersonalDetails] = useState(false);

  return (
    <div className="bg-white rounded-lg shadow p-4 mb-4">
      <div className="flex justify-between items-center">
        <h2 className="font-bold text-lg">Member Info</h2>
        <Button variant="ghost" size="sm" className="h-8">
          <Edit className="h-4 w-4 mr-1" /> Edit details
        </Button>
      </div>

      <div className="space-y-3 mt-3">
        {memberData?.designation && (
          <div className="flex items-center text-gray-700">
            <Briefcase className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{memberData.designation}</span>
          </div>
        )}
        
        {memberData?.department && (
          <div className="flex items-center text-gray-700">
            <User className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">Department: {memberData.department}</span>
          </div>
        )}
        
        {memberData?.joinDate && (
          <div className="flex items-center text-gray-700">
            <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">Joined on {memberData.joinDate}</span>
          </div>
        )}

        {memberData?.email && (
          <div className="flex items-center text-gray-700">
            <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{memberData.email}</span>
          </div>
        )}

        {memberData?.phone && (
          <div className="flex items-center text-gray-700">
            <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
            <span className="text-sm">{memberData.phone}</span>
          </div>
        )}

        {memberData?.meetingsAttended !== undefined && memberData?.totalMeetings !== undefined && (
          <div className="flex items-center text-gray-700">
            <div className="h-5 w-5 mr-2 flex-shrink-0 flex items-center justify-center">📊</div>
            <span className="text-sm">
              Meeting Attendance: {memberData.meetingsAttended}/{memberData.totalMeetings} ({Math.round((memberData.meetingsAttended / memberData.totalMeetings) * 100)}%)
            </span>
          </div>
        )}
        
        {memberData?.lastActive && (
          <div className="flex items-center text-gray-700">
            <div className="h-5 w-5 mr-2 flex-shrink-0 flex items-center justify-center">⏱️</div>
            <span className="text-sm">
              Last Active: {memberData.lastActive}
            </span>
          </div>
        )}
      </div>
      
      {/* Business Details Section */}
      {memberData?.businessDetails && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setShowBusinessDetails(!showBusinessDetails)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-md flex items-center">
              <Building className="h-4 w-4 mr-2" /> Business Details
            </h3>
            <span>{showBusinessDetails ? '▲' : '▼'}</span>
          </button>
          
          {showBusinessDetails && (
            <div className="space-y-3 mt-3 pl-2">
              {memberData.businessDetails.organizationName && (
                <div className="flex items-center text-gray-700">
                  <Building className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{memberData.businessDetails.organizationName}</span>
                </div>
              )}
              
              {memberData.businessDetails.organizationEmail && (
                <div className="flex items-center text-gray-700">
                  <Mail className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{memberData.businessDetails.organizationEmail}</span>
                </div>
              )}
              
              {memberData.businessDetails.organizationPhone && (
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{memberData.businessDetails.organizationPhone}</span>
                </div>
              )}
              
              {memberData.businessDetails.organizationLandline && (
                <div className="flex items-center text-gray-700">
                  <Phone className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{memberData.businessDetails.organizationLandline} (Landline)</span>
                </div>
              )}
              
              {memberData.businessDetails.gstNo && (
                <div className="flex items-center text-gray-700">
                  <CreditCard className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">GST: {memberData.businessDetails.gstNo}</span>
                </div>
              )}
              
              {memberData.businessDetails.organizationWebsite && (
                <div className="flex items-center text-gray-700">
                  <Globe className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">
                    <a href={memberData.businessDetails.organizationWebsite} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {memberData.businessDetails.organizationWebsite}
                    </a>
                  </span>
                </div>
              )}
              
              {memberData.businessDetails.organizationAddress && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{memberData.businessDetails.organizationAddress}</span>
                </div>
              )}
              
              {memberData.businessDetails.organizationDescription && (
                <div className="flex text-gray-700">
                  <Info className="h-5 w-5 mr-2 flex-shrink-0 mt-1" />
                  <span className="text-sm">{memberData.businessDetails.organizationDescription}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Personal Details Section */}
      {memberData?.personalDetails && (
        <div className="mt-4 border-t pt-3">
          <button
            onClick={() => setShowPersonalDetails(!showPersonalDetails)}
            className="flex items-center justify-between w-full text-left"
          >
            <h3 className="font-semibold text-md flex items-center">
              <User className="h-4 w-4 mr-2" /> Personal Details
            </h3>
            <span>{showPersonalDetails ? '▲' : '▼'}</span>
          </button>
          
          {showPersonalDetails && (
            <div className="space-y-3 mt-3 pl-2">
              {memberData.personalDetails.gender && (
                <div className="flex items-center text-gray-700">
                  <User className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">Gender: {memberData.personalDetails.gender}</span>
                </div>
              )}
              
              {memberData.personalDetails.dob && (
                <div className="flex items-center text-gray-700">
                  <Calendar className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">Date of Birth: {memberData.personalDetails.dob}</span>
                </div>
              )}
              
              {memberData.personalDetails.address && (
                <div className="flex items-center text-gray-700">
                  <MapPin className="h-5 w-5 mr-2 flex-shrink-0" />
                  <span className="text-sm">{memberData.personalDetails.address}</span>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <Button variant="secondary" className="w-full bg-gray-200">View full profile</Button>
      </div>
    </div>
  );
};

export default Infosection;
