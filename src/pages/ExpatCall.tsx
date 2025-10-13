import React, { useMemo } from 'react';
import { Users, MapPin, Clock, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useIntl } from 'react-intl';
import Layout from '../components/layout/Layout';

const ExpatCall: React.FC = () => {
  const intl = useIntl();

  const expatAdvantages = useMemo(() => [
    {
      icon: Users,
      title: intl.formatMessage({ id: 'expatCall.livedExperience' }),
      description: intl.formatMessage({ id: 'expatCall.livedExperienceDesc' })
    },
    {
      icon: MapPin,
      title: intl.formatMessage({ id: 'expatCall.localKnowledge' }),
      description: intl.formatMessage({ id: 'expatCall.localKnowledgeDesc' })
    },
    {
      icon: Clock,
      title: intl.formatMessage({ id: 'expatCall.extendedAvailability' }),
      description: intl.formatMessage({ id: 'expatCall.extendedAvailabilityDesc' })
    }
  ], [intl]);

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50">
        <div className="bg-green-600 text-white py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="flex justify-center mb-6">
              <div className="bg-white rounded-full p-4">
                <Users className="w-12 h-12 text-green-600" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {intl.formatMessage({ id: 'expatCall.title' })}
            </h1>
            <p className="text-xl text-green-100 max-w-2xl mx-auto mb-8">
              {intl.formatMessage({ id: 'expatCall.subtitle' })}
            </p>
            <div className="bg-green-700 rounded-lg p-4 inline-block">
              <div className="text-3xl font-bold">
                {intl.formatMessage({ id: 'expatCall.price' })}
              </div>
              <div className="text-green-100">
                {intl.formatMessage({ id: 'expatCall.duration' })}
              </div>
            </div>
          </div>
        </div>
        
        <div className="py-16">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">
              {intl.formatMessage({ id: 'expatCall.whyChoose' })}
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
              {expatAdvantages.map((advantage, index) => (
                <div key={index} className="text-center">
                  <div className="flex justify-center mb-4">
                    <div className="bg-green-100 rounded-full p-4">
                      <advantage.icon className="w-8 h-8 text-green-600" />
                    </div>
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-3">
                    {advantage.title}
                  </h3>
                  <p className="text-gray-600">
                    {advantage.description}
                  </p>
                </div>
              ))}
            </div>

            <div className="text-center">
              <Link
                to="/sos-appel?type=expat"
                className="bg-green-600 hover:bg-green-700 text-white px-12 py-4 rounded-lg font-bold text-xl transition-colors inline-flex items-center"
              >
                {intl.formatMessage({ id: 'expatCall.seeAvailable' })}
                <ArrowRight className="ml-2" size={20} />
              </Link>
              <p className="mt-4 text-gray-600">
                {intl.formatMessage({ id: 'expatCall.guarantees' })}
              </p>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default ExpatCall;
